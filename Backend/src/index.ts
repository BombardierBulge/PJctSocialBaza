import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { createConnection } from 'typeorm';
import { User } from './entity/User';
import { Post } from './entity/Post';
import { Comment } from './entity/Comment';
import { Like } from './entity/Like';
import { UserPassword } from './entity/UserPassword';
import { UserProfile } from './entity/UserProfile';
import { Follow } from './entity/Follow';
import { startRoutes } from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// statyczne pliki na serwerze
app.use('/uploads', express.static('uploads'));

// Konfiguracja Multer
import multer from 'multer';
import fs from 'fs';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Filtr plików - tylko obrazy
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, gif, webp)'));
  }
};

const upload = multer({ storage: storage, fileFilter: imageFilter });

app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ path: `/uploads/${req.file.filename}` });
});

// Połączenie z bazą danych
const mainConnection = createConnection({
  name: 'main',
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'socialbaza',
  entities: [User, Post, Comment, Like, UserProfile, Follow],
  synchronize: false,
  logging: false,
});

const authConnection = createConnection({
  name: 'auth',
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE_AUTH || 'socialbaza_auth',
  entities: [UserPassword],
  synchronize: true,
  logging: false,
});

Promise.all([mainConnection, authConnection]).then(async ([mainConn, authConn]) => {
  console.log('Connected to PostgreSQL databases');

  // Sprawdzenie danych początkowych (Uproszczone)
  try {
    const userRepository = mainConn.getRepository(User);
    const userCount = await userRepository.count();
    if (userCount === 0) {
      console.log('Seeding initial data...');
      const user1 = userRepository.create({ user_id: 1, username: 'jan_kowalski', email: 'jan@example.com', is_admin: false });
      const user2 = userRepository.create({ user_id: 2, username: 'anna_nowak', email: 'anna@example.com', is_admin: false });
      await userRepository.save([user1, user2]);

      const profileRepository = mainConn.getRepository(UserProfile);
      const profile1 = profileRepository.create({ userId: 1, avatarUrl: 'zdj1.jpg', bio: 'Lubię programować', location: 'Warszawa' });
      const profile2 = profileRepository.create({ userId: 2, avatarUrl: 'zdj2.jpg', bio: 'Miłośniczka książek', website: 'https://anna.com' });
      await profileRepository.save([profile1, profile2]);
      console.log('Seeding complete.');
    }
  } catch (err) {
    console.error('Seeding error (ignorable):', err);
  }


}).catch(error => console.log(error));


// Dokumentacja API (Strona główna)
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SocialBaza API</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
      </style>
    </head>
    <body>
      <h1>SocialBaza API (Refactored)</h1>
      <p>API is running. Endpoints are now managed via <code>routes.ts</code>.</p>
    </body>
    </html>
  `;
  res.send(html);
});

// Register routes
startRoutes(app);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});