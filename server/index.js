import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import NodeCache from 'node-cache';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize a 15-second TTL cache for dashboard queries
const myCache = new NodeCache({ stdTTL: 15, checkperiod: 30 });

// ── App setup ──────────────────────────────────────────────────────────────────
const app = express();
const server = createServer(app);
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-please-change-in-production';

// Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Socket.IO
const io = new Server(server, {
  cors: { origin: '*', credentials: false }
});

// Express middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || true, credentials: true }));
app.use(express.json({ limit: '2mb' }));

// Multer (memory storage for Cloudinary uploads)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

// Wrap multer middleware in a promise so errors reach the route's try/catch
// and are returned as JSON instead of Express's default HTML error page.
const runUpload = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single('image')(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

// ── Mongoose Schemas ───────────────────────────────────────────────────────────
const ROLES = ['organizer', 'team_lead', 'volunteer'];
const MEMBER_ROLES = ['team_lead', 'volunteer'];

const User = mongoose.model('User', new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:   { type: String, required: true },
  globalRole: { type: String, enum: ROLES, required: true },
}, { timestamps: true }));

const Event = mongoose.model('Event', new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  bannerUrl:   { type: String, default: '' },
  venue:       { type: String, default: '' },
  startDate:   { type: String, default: '' },
  endDate:     { type: String, default: '' },
  ownerId:     { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  members: [{
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:     String,
    email:    String,
    role:     { type: String, enum: MEMBER_ROLES },
    teamName: { type: String, default: '' },
  }],
}, { timestamps: true }));

const SubEvent = mongoose.model('SubEvent', new mongoose.Schema({
  eventId:      { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Event' },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, default: '' },
  date:         { type: String, default: '' },
  startTime:    { type: String, default: '' },
  endTime:      { type: String, default: '' },
  assignedTeam: { type: String, default: '' },
}, { timestamps: true }));

const Message = mongoose.model('Message', new mongoose.Schema({
  eventId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Event' },
  teamName:   { type: String, default: null }, // null = organizer↔team_lead channel
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: String,
  senderRole: String,
  text:       { type: String, required: true },
}, { timestamps: true }));

const Announcement = mongoose.model('Announcement', new mongoose.Schema({
  eventId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'Event' },
  title:      { type: String, required: true },
  body:       { type: String, default: '' },
  authorId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  authorName: String,
}, { timestamps: true }));

// ── Output serializers ─────────────────────────────────────────────────────────
const sid = v => String(v?._id || v?.id || v);

const tokenFor = u => jwt.sign({ sub: sid(u) }, jwtSecret, { expiresIn: '7d' });

const userOut = u => ({
  id: sid(u), name: u.name, email: u.email, globalRole: u.globalRole,
});

const eventOut = (event, userId) => {
  const isOwner = sid(event.ownerId) === userId;
  const member  = isOwner ? null : event.members.find(m => sid(m.userId) === userId);
  const role     = isOwner ? 'organizer' : (member?.role ?? null);
  return {
    id: sid(event),
    title: event.title,
    description: event.description,
    bannerUrl: event.bannerUrl,
    venue: event.venue,
    startDate: event.startDate,
    endDate: event.endDate,
    role,
    teamName: member?.teamName ?? '',
    memberCount: event.members.length + 1,
  };
};

const subEventOut = s => ({
  id: sid(s),
  title: s.title,
  description: s.description,
  date: s.date,
  startTime: s.startTime,
  endTime: s.endTime,
  assignedTeam: s.assignedTeam,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

const messageOut = m => ({
  id: sid(m),
  teamName: m.teamName,
  senderId: sid(m.senderId),
  senderName: m.senderName,
  senderRole: m.senderRole,
  text: m.text,
  createdAt: m.createdAt,
});

const announcementOut = a => ({
  id: sid(a),
  title: a.title,
  body: a.body,
  authorName: a.authorName,
  createdAt: a.createdAt,
});

// ── Middleware ─────────────────────────────────────────────────────────────────
const auth = async (req, res, next) => {
  try {
    const raw = req.headers.authorization?.replace('Bearer ', '');
    if (!raw) throw new Error('No token');
    const payload = jwt.verify(raw, jwtSecret);
    const user = await User.findById(payload.sub);
    if (!user) throw new Error('User not found');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Authentication required.' });
  }
};

const eventAccess = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const isOwner = sid(event.ownerId) === sid(req.user);
    const member  = isOwner ? null : event.members.find(m => sid(m.userId) === sid(req.user));
    const role    = isOwner ? 'organizer' : member?.role;
    if (!role) return res.status(403).json({ error: 'You are not a member of this event.' });
    req.event     = event;
    req.eventRole = role;
    req.teamName  = member?.teamName ?? '';
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const requireOrganizer = (req, res, next) =>
  req.eventRole === 'organizer'
    ? next()
    : res.status(403).json({ error: 'Organizer access required.' });

// ── Health ─────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// Cloudinary credential test — visit /api/cloudinary-ping in your browser to verify
app.get('/api/cloudinary-ping', async (_req, res) => {
  try {
    const cfg = cloudinary.config();
    // Use the Admin API ping — requires valid api_key + api_secret
    const ping = await cloudinary.api.ping();
    res.json({
      ok:         true,
      status:     ping.status,
      cloud_name: cfg.cloud_name,
      api_key:    cfg.api_key ? `${String(cfg.api_key).slice(0, 4)}****` : '❌ NOT SET',
      api_secret: cfg.api_secret ? `****${String(cfg.api_secret).slice(-4)}` : '❌ NOT SET',
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message, http_code: err.http_code });
  }
});

// ── Auth ───────────────────────────────────────────────────────────────────────
const ALLOWED_DOMAIN = 'iiita.ac.in';

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, globalRole } = req.body;
    if (!name?.trim())                        return res.status(400).json({ error: 'Name is required.' });
    if (!email?.includes('@'))                return res.status(400).json({ error: 'Valid email is required.' });
    if (!password || password.length < 8)    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (!ROLES.includes(globalRole))          return res.status(400).json({ error: 'Invalid role.' });

    // ── IIITA community restriction ──────────────────────────────────────────
    const emailDomain = email.toLowerCase().split('@')[1];
    if (emailDomain !== ALLOWED_DOMAIN) {
      return res.status(403).json({
        error: `Registration is restricted to @${ALLOWED_DOMAIN} email addresses only.`,
      });
    }

    const exists = await User.exists({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: await bcrypt.hash(password, 12),
      globalRole,
    });
    res.status(201).json({ token: tokenFor(user), user: userOut(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password ?? '', user.password))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    res.json({ token: tokenFor(user), user: userOut(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/me', auth, (req, res) => res.json(userOut(req.user)));

// ── Events ─────────────────────────────────────────────────────────────────────
app.get('/api/events', auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [{ ownerId: req.user._id }, { 'members.userId': req.user._id }],
    }).sort({ createdAt: -1 });
    res.json(events.map(e => eventOut(e, sid(req.user))));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', auth, async (req, res) => {
  try {
    if (req.user.globalRole !== 'organizer')
      return res.status(403).json({ error: 'Only organizers can create events.' });
    const { title, description, venue, startDate, endDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Event title is required.' });
    const event = await Event.create({
      title: title.trim(),
      description: description ?? '',
      venue: venue ?? '',
      startDate: startDate ?? '',
      endDate: endDate ?? '',
      ownerId: req.user._id,
      members: [],
    });
    res.status(201).json(eventOut(event, sid(req.user)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events/:eventId', auth, eventAccess, (req, res) =>
  res.json(eventOut(req.event, sid(req.user))));

app.patch('/api/events/:eventId', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    const fields = ['title', 'description', 'bannerUrl', 'venue', 'startDate', 'endDate'];
    const update = {};
    fields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const event = await Event.findByIdAndUpdate(req.event._id, update, { new: true });
    res.json(eventOut(event, sid(req.user)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:eventId', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    const eid = req.event._id;
    await Promise.all([
      Event.findByIdAndDelete(eid),
      SubEvent.deleteMany({ eventId: eid }),
      Message.deleteMany({ eventId: eid }),
      Announcement.deleteMany({ eventId: eid }),
    ]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Banner upload to Cloudinary
app.post('/api/events/:eventId/banner', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    // Run multer inside try/catch so any file-type or size errors come back as JSON
    await runUpload(req, res);

    if (!req.file) return res.status(400).json({ error: 'No image file provided.' });

    // Convert buffer → base64 data URL and upload to Cloudinary
    const b64    = Buffer.from(req.file.buffer).toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataUrl, {
      public_id:     `eventverse_banner_${sid(req.event)}`,
      overwrite:     true,
      resource_type: 'image',
    });

    const event = await Event.findByIdAndUpdate(
      req.event._id,
      { bannerUrl: result.secure_url },
      { new: true }
    );
    res.json({ bannerUrl: event.bannerUrl });
  } catch (err) {
    // Log full Cloudinary error so we can diagnose it in Render logs
    console.error('Banner upload error:', {
      message:   err.message,
      http_code: err.http_code,
      name:      err.name,
      full:      JSON.stringify(err),
    });
    res.status(500).json({ error: err.message, http_code: err.http_code ?? null });
  }
});

// ── Members ────────────────────────────────────────────────────────────────────
app.get('/api/events/:eventId/members', auth, eventAccess, async (req, res) => {
  try {
    const owner = await User.findById(req.event.ownerId).select('name email');
    const list = [
      { id: sid(req.event.ownerId), name: owner?.name ?? 'Organizer', email: owner?.email ?? '', role: 'organizer', teamName: '' },
      ...req.event.members.map(m => ({
        id: sid(m.userId), name: m.name, email: m.email, role: m.role, teamName: m.teamName,
      })),
    ];
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events/:eventId/members', auth, eventAccess, async (req, res) => {
  try {
    // Organizers can add anyone. Team leads can only add volunteers to their own team.
    if (req.eventRole !== 'organizer' && req.eventRole !== 'team_lead') {
      return res.status(403).json({ error: 'Only organizers and team leads can add members.' });
    }

    const { email, role, teamName } = req.body;
    if (!email?.includes('@'))               return res.status(400).json({ error: 'Valid email is required.' });
    if (!MEMBER_ROLES.includes(role))        return res.status(400).json({ error: 'Role must be team_lead or volunteer.' });
    if (!teamName?.trim())                   return res.status(400).json({ error: 'Team name is required.' });

    // ── Team lead restrictions ───────────────────────────────────────────────
    if (req.eventRole === 'team_lead') {
      if (role !== 'volunteer') {
        return res.status(403).json({ error: 'Team leads can only add volunteers, not other team leads.' });
      }
      if (teamName.trim() !== req.teamName) {
        return res.status(403).json({ error: `You can only add volunteers to your own team (${req.teamName}).` });
      }
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found. Ask them to register first.' });
    if (sid(user._id) === sid(req.event.ownerId))
      return res.status(409).json({ error: 'That user is the event organizer.' });
    if (req.event.members.some(m => sid(m.userId) === sid(user._id)))
      return res.status(409).json({ error: 'User is already a member of this event.' });

    req.event.members.push({
      userId: user._id, name: user.name, email: user.email,
      role, teamName: teamName.trim(),
    });
    await req.event.save();
    res.status(201).json({ id: sid(user._id), name: user.name, email: user.email, role, teamName: teamName.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/events/:eventId/members/:userId', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    const member = req.event.members.find(m => sid(m.userId) === req.params.userId);
    if (!member) return res.status(404).json({ error: 'Member not found.' });
    if (req.body.role && MEMBER_ROLES.includes(req.body.role)) member.role = req.body.role;
    if (req.body.teamName !== undefined) member.teamName = req.body.teamName;
    await req.event.save();
    res.json({ id: sid(member.userId), name: member.name, email: member.email, role: member.role, teamName: member.teamName });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:eventId/members/:userId', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    req.event.members = req.event.members.filter(m => sid(m.userId) !== req.params.userId);
    await req.event.save();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Teams ──────────────────────────────────────────────────────────────────────
app.get('/api/events/:eventId/teams', auth, eventAccess, (req, res) => {
  const members = req.event.members;
  const teamNames = [...new Set(members.map(m => m.teamName).filter(Boolean))].sort();
  const teams = teamNames.map(name => {
    const lead       = members.find(m => m.role === 'team_lead' && m.teamName === name);
    const volunteers = members.filter(m => m.role === 'volunteer' && m.teamName === name);
    return {
      name,
      lead: lead ? { id: sid(lead.userId), name: lead.name, email: lead.email } : null,
      volunteers: volunteers.map(v => ({ id: sid(v.userId), name: v.name, email: v.email })),
      volunteerCount: volunteers.length,
    };
  });
  res.json(teams);
});

// ── SubEvents (Schedule) ───────────────────────────────────────────────────────
app.get('/api/events/:eventId/subevents', auth, eventAccess, async (req, res) => {
  try {
    const subevents = await SubEvent.find({ eventId: req.event._id }).sort({ date: 1, startTime: 1 });
    res.json(subevents.map(subEventOut));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events/:eventId/subevents', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    const { title, description, date, startTime, endTime, assignedTeam } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required.' });
    const se = await SubEvent.create({
      eventId: req.event._id,
      title: title.trim(),
      description: description ?? '',
      date: date ?? '',
      startTime: startTime ?? '',
      endTime: endTime ?? '',
      assignedTeam: assignedTeam ?? '',
    });
    const out = subEventOut(se);
    io.to(sid(req.event)).emit('subevent:created', out);
    res.status(201).json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/events/:eventId/subevents/:subId', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    const se = await SubEvent.findOne({ _id: req.params.subId, eventId: req.event._id });
    if (!se) return res.status(404).json({ error: 'Sub-event not found.' });
    const fields = ['title', 'description', 'date', 'startTime', 'endTime', 'assignedTeam'];
    fields.forEach(f => { if (req.body[f] !== undefined) se[f] = req.body[f]; });
    await se.save();
    const out = subEventOut(se);
    io.to(sid(req.event)).emit('subevent:updated', out);
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:eventId/subevents/:subId', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    const se = await SubEvent.findOneAndDelete({ _id: req.params.subId, eventId: req.event._id });
    if (!se) return res.status(404).json({ error: 'Sub-event not found.' });
    io.to(sid(req.event)).emit('subevent:deleted', { id: req.params.subId });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Messages ───────────────────────────────────────────────────────────────────
// teamName query: absent/null = organizer↔team_lead channel; string = team channel
app.get('/api/events/:eventId/messages', auth, eventAccess, async (req, res) => {
  try {
    const raw = req.query.teamName;
    const isOrgChannel = !raw || raw === 'null';

    // Access control
    if (req.eventRole === 'volunteer') {
      if (isOrgChannel) return res.status(403).json({ error: 'Volunteers cannot access the organizer channel.' });
      if (raw !== req.teamName) return res.status(403).json({ error: 'Volunteers can only view their own team channel.' });
    } else if (req.eventRole === 'team_lead') {
      if (!isOrgChannel && raw !== req.teamName) return res.status(403).json({ error: 'You can only view your team channel.' });
    }

    const query = { eventId: req.event._id, teamName: isOrgChannel ? null : raw };
    const messages = await Message.find(query).sort({ createdAt: 1 }).limit(300);
    res.json(messages.map(messageOut));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events/:eventId/messages', auth, eventAccess, async (req, res) => {
  try {
    const { teamName, text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Message text is required.' });
    const isOrgChannel = !teamName || teamName === 'null' || teamName === null;

    // Access control
    if (req.eventRole === 'volunteer') {
      if (isOrgChannel) return res.status(403).json({ error: 'Volunteers cannot post to the organizer channel.' });
      if (teamName !== req.teamName) return res.status(403).json({ error: 'Volunteers can only post to their own team channel.' });
    } else if (req.eventRole === 'team_lead') {
      if (!isOrgChannel && teamName !== req.teamName) return res.status(403).json({ error: 'You can only post to your team channel.' });
    }

    const msg = await Message.create({
      eventId: req.event._id,
      teamName: isOrgChannel ? null : teamName,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.eventRole,
      text: text.trim(),
    });
    const out = messageOut(msg);
    io.to(sid(req.event)).emit('message:new', out);
    res.status(201).json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Announcements ──────────────────────────────────────────────────────────────
app.get('/api/events/:eventId/announcements', auth, eventAccess, async (req, res) => {
  try {
    const list = await Announcement.find({ eventId: req.event._id }).sort({ createdAt: -1 });
    res.json(list.map(announcementOut));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events/:eventId/announcements', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Announcement title is required.' });
    const ann = await Announcement.create({
      eventId: req.event._id,
      title: title.trim(),
      body: body ?? '',
      authorId: req.user._id,
      authorName: req.user.name,
    });
    const out = announcementOut(ann);
    io.to(sid(req.event)).emit('announcement:new', out);
    res.status(201).json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:eventId/announcements/:annId', auth, eventAccess, requireOrganizer, async (req, res) => {
  try {
    await Announcement.findOneAndDelete({ _id: req.params.annId, eventId: req.event._id });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Dashboard ──────────────────────────────────────────────────────────────────
app.get('/api/events/:eventId/dashboard', auth, eventAccess, async (req, res) => {
  try {
    const { event, eventRole: role, teamName } = req;
    const today = new Date().toISOString().split('T')[0];

    const cacheKey = `dashboard_data_${event._id}`;
    let dashboardData = myCache.get(cacheKey);

    if (!dashboardData) {
      // Cache miss: query the database
      const [allSubEvents, announcements, totalMessages] = await Promise.all([
        SubEvent.find({ eventId: event._id }).sort({ date: 1, startTime: 1 }),
        Announcement.find({ eventId: event._id }).sort({ createdAt: -1 }).limit(3),
        Message.countDocuments({ eventId: event._id }),
      ]);
      dashboardData = { allSubEvents, announcements, totalMessages };
      myCache.set(cacheKey, dashboardData); // Cached for 15 seconds
    }

    const { allSubEvents, announcements, totalMessages } = dashboardData;

    let upcoming = allSubEvents.filter(s => !s.date || s.date >= today);
    if (role === 'volunteer' && teamName) {
      upcoming = upcoming.filter(s => !s.assignedTeam || s.assignedTeam === teamName);
    }

    const teams = [...new Set(event.members.map(m => m.teamName).filter(Boolean))];
    const teamLeads = event.members.filter(m => m.role === 'team_lead');
    const volunteers = event.members.filter(m => m.role === 'volunteer');

    const stats = {
      totalMembers: event.members.length + 1,
      totalTeams: teams.length,
      totalSubEvents: allSubEvents.length,
      totalAnnouncements: announcements.length,
      totalMessages,
      teamLeadCount: teamLeads.length,
      volunteerCount: volunteers.length,
    };

    if (role === 'team_lead') {
      stats.myTeamVolunteers = volunteers.filter(v => v.teamName === teamName).length;
    }

    res.json({
      event: eventOut(event, sid(req.user)),
      role,
      teamName,
      stats,
      upcomingSubEvents: upcoming.slice(0, 5).map(subEventOut),
      announcements: announcements.map(announcementOut),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Socket.IO ──────────────────────────────────────────────────────────────────
io.on('connection', socket => {
  socket.on('event:join',  id => socket.join(id));
  socket.on('event:leave', id => socket.leave(id));
});

// ── Serve React Frontend (Monolith) ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../dist')));

app.get(/^(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// ── Boot ───────────────────────────────────────────────────────────────────────
async function boot() {
  if (!process.env.MONGO_URI) {
    if (process.env.NODE_ENV === 'production') throw new Error('MONGO_URI is required in production.');
    console.error('❌  MONGO_URI is not set. Please add it to your .env file.');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, {
    // Keep the connection pool small — EventVerse has low concurrency needs.
    // Default is 10; 5 is more than enough and keeps Atlas usage well within limits.
    maxPoolSize: 5,
    minPoolSize: 1,
    // Close idle connections after 30 seconds to release Atlas slots.
    maxIdleTimeMS: 30_000,
    // Standard operation timeouts.
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,
    // Don't create indexes automatically in production (reduces extra connections at startup).
    autoIndex: process.env.NODE_ENV !== 'production',
  });
  console.log('✅  MongoDB connected  (pool: 1–5 connections)');
  server.listen(port, () => console.log(`🚀  EventVerse API  →  http://localhost:${port}`));
}

boot().catch(err => { console.error('Boot error:', err.message); process.exit(1); });
