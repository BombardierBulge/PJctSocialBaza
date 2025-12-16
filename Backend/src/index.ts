import 'reflect-metadata';
import express from 'express';
import { createConnection, getRepository } from 'typeorm';
import { User } from './entity/User'; // Example entity
import { Post } from './entity/Post';
import { Comment } from './entity/Comment';
import { Like } from './entity/Like';
import { UserPassword } from './entity/UserPassword';
import { UserProfile } from './entity/UserProfile';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Main database connection
const mainConnection = createConnection({
  name: 'main',
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'socialbaza',
  entities: [User, Post, Comment, Like, UserProfile],
  synchronize: true, // Set to false in production
  logging: false,
});

// Auth database connection
const authConnection = createConnection({
  name: 'auth',
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: 'socialbaza_auth',
  entities: [UserPassword],
  synchronize: true,
  logging: false,
});

Promise.all([mainConnection, authConnection]).then(async ([mainConn, authConn]) => {
  console.log('Connected to PostgreSQL databases');

  // Seed sample data for main DB
  const userRepository = mainConn.getRepository(User);
  const postRepository = mainConn.getRepository(Post);
  const commentRepository = mainConn.getRepository(Comment);
  const likeRepository = mainConn.getRepository(Like);
  const profileRepository = mainConn.getRepository(UserProfile);

  const userCount = await userRepository.count();
  if (userCount === 0) {
    console.log('Seeding sample data...');

    // Create users
    const user1 = userRepository.create({ name: 'Jan Kowalski', email: 'jan@example.com' });
    const user2 = userRepository.create({ name: 'Anna Nowak', email: 'anna@example.com' });
    await userRepository.save([user1, user2]);

    // Create profiles
    const profile1 = profileRepository.create({ user: user1, bio: 'Lubię programować', location: 'Warszawa' });
    const profile2 = profileRepository.create({ user: user2, bio: 'Miłośniczka książek', website: 'anna.com' });
    await profileRepository.save([profile1, profile2]);

    // Create posts
    const post1 = postRepository.create({ title: 'Pierwszy post', content: 'To jest mój pierwszy post!', author: user1 });
    const post2 = postRepository.create({ title: 'Drugi post', content: 'Świetny dzień!', author: user2 });
    await postRepository.save([post1, post2]);

    // Create comments
    const comment1 = commentRepository.create({ content: 'Świetny post!', author: user2, post: post1 });
    await commentRepository.save(comment1);

    // Create likes
    const like1 = likeRepository.create({ user: user2, post: post1 });
    await likeRepository.save(like1);

    console.log('Sample data seeded.');
  }

  // Seed sample password for auth DB
  const passwordRepository = authConn.getRepository(UserPassword);
  const passwordCount = await passwordRepository.count();
  if (passwordCount === 0) {
    const password1 = passwordRepository.create({ userId: 1, passwordHash: 'hashedpassword1' });
    const password2 = passwordRepository.create({ userId: 2, passwordHash: 'hashedpassword2' });
    await passwordRepository.save([password1, password2]);
  }
}).catch(error => console.log(error));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// API routes
app.get('/User', async (req, res) => {
  try {
    const userRepository = getRepository(User, 'main');
    const users = await userRepository.find({ relations: ['posts', 'comments', 'likes'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/Post', async (req, res) => {
  try {
    const postRepository = getRepository(Post, 'main');
    const posts = await postRepository.find({ relations: ['author', 'comments', 'likes'] });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/Comment', async (req, res) => {
  try {
    const commentRepository = getRepository(Comment, 'main');
    const comments = await commentRepository.find({ relations: ['author', 'post'] });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/Like', async (req, res) => {
  try {
    const likeRepository = getRepository(Like, 'main');
    const likes = await likeRepository.find({ relations: ['user', 'post'] });
    res.json(likes);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/UserProfile', async (req, res) => {
  try {
    const profileRepository = getRepository(UserProfile, 'main');
    const profiles = await profileRepository.find({ relations: ['user'] });
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/UserPassword', async (req, res) => {
  try {
    const passwordRepository = getRepository(UserPassword, 'auth');
    const passwords = await passwordRepository.find();
    res.json(passwords);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});