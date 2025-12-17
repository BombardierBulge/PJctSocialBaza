import 'reflect-metadata';
import express from 'express';
import { createConnection, getRepository } from 'typeorm';
import { User } from './entity/User';
import { Post } from './entity/Post';
import { Comment } from './entity/Comment';
import { Like } from './entity/Like';
import { UserPassword } from './entity/UserPassword';
import { UserProfile } from './entity/UserProfile';
import { Follow } from './entity/Follow';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// połączenie główne z bazą
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

// połączenie do haseł(bez hashy)
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

  // tworzenie danych przykładowych, jeśli tabele są puste
  const userRepository = mainConn.getRepository(User);
  const postRepository = mainConn.getRepository(Post);
  const commentRepository = mainConn.getRepository(Comment);
  const likeRepository = mainConn.getRepository(Like);
  const profileRepository = mainConn.getRepository(UserProfile);
  const followRepository = mainConn.getRepository(Follow);


  const userCount = await userRepository.count();
  if (userCount === 0) {
    const user1 = userRepository.create({ user_id: 1, username: 'jan_kowalski', email: 'jan@example.com', is_admin: false });
    const user2 = userRepository.create({ user_id: 2, username: 'anna_nowak', email: 'anna@example.com', is_admin: false });
    await userRepository.save([user1, user2]);
    console.log('Seeded users');
  }


  const profileCount = await profileRepository.count();
  if (profileCount === 0) {
    const profile1 = profileRepository.create({ userId: 1, avatarUrl: 'zdj1.jpg', bio: 'Lubię programować', location: 'Warszawa' });
    const profile2 = profileRepository.create({ userId: 2, avatarUrl: 'zdj2.jpg', bio: 'Miłośniczka książek', website: 'https://anna.com' });
    await profileRepository.save([profile1, profile2]);
    console.log('Seeded profiles');
  }


  const postCount = await postRepository.count();
  if (postCount === 0) {
    const post1 = postRepository.create({ post_id: 1, user_id: 1, content: 'To jest mój pierwszy post!' });
    const post2 = postRepository.create({ post_id: 2, user_id: 2, content: 'Świetny dzień!' });
    await postRepository.save([post1, post2]);
    console.log('Seeded posts');
  }


  const commentCount = await commentRepository.count();
  if (commentCount === 0) {
    const comment1 = commentRepository.create({ comment_id: 1, user_id: 2, post_id: 1, content: 'Świetny post!' });
    await commentRepository.save(comment1);
    console.log('Seeded comments');
  }


  const likeCount = await likeRepository.count();
  if (likeCount === 0) {
    const like1 = likeRepository.create({ like_id: 1, user_id: 2, post_id: 1 });
    await likeRepository.save(like1);
    console.log('Seeded likes');
  }

  
  const followCount = await followRepository.count();
  if (followCount === 0) {
    const follow1 = followRepository.create({ follower_id: 2, followed_id: 1 });
    await followRepository.save(follow1);
    console.log('Seeded follows');
  }

  
  const passwordRepository = authConn.getRepository(UserPassword);
  const passwordCount = await passwordRepository.count();
  if (passwordCount === 0) {
    const password1 = passwordRepository.create({ user_id: 1, password_hash: 'hashedpassword1' });
    const password2 = passwordRepository.create({ user_id: 2, password_hash: 'hashedpassword2' });
    await passwordRepository.save([password1, password2]);
  }
}).catch(error => console.log(error));
///////////////////////////////////////////////////
app.get('/', (req, res) => {
  res.send('Hello World!');
});

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
    const posts = await postRepository.find({ relations: ['user', 'comments', 'likes'] });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// post z id
app.get('/Post/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const postRepository = getRepository(Post, 'main');
    const post = await postRepository.findOne({ where: { post_id: id }, relations: ['user', 'comments', 'likes'] });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/Comment', async (req, res) => {
  try {
    const commentRepository = getRepository(Comment, 'main');
    const comments = await commentRepository.find({ relations: ['user', 'post'] });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// koamentarze do id posta 
app.get('/Comment/post/:postId', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (Number.isNaN(postId)) return res.status(400).json({ error: 'Invalid postId' });
    const commentRepository = getRepository(Comment, 'main');
    const comments = await commentRepository.find({ where: { post_id: postId }, relations: ['user'] });
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

// like z id posta
app.get('/Like/post/:postId', async (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    if (Number.isNaN(postId)) return res.status(400).json({ error: 'Invalid postId' });
    const likeRepository = getRepository(Like, 'main');
    const likes = await likeRepository.find({ where: { post_id: postId }, relations: ['user'] });
    res.json(likes);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/UserProfile', async (req, res) => {
  try {
    const profileRepository = getRepository(UserProfile, 'main');
    const profiles = await profileRepository.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// get profil po id użytkownika
app.get('/UserProfile/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });
    const profileRepository = getRepository(UserProfile, 'main');
    const userRepository = getRepository(User, 'main');

    const profile = await profileRepository.findOne({ where: { userId: userId } });
    const user = await userRepository.findOne({ where: { user_id: userId } });
    if (!user && !profile) return res.status(404).json({ error: 'Not found' });
    res.json({ user, profile });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/Follow', async (req, res) => {
  try {
    const followRepository = getRepository(Follow, 'main');
    const follows = await followRepository.find({ relations: ['follower', 'followed'] });
    res.json(follows);
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

// hasło z bazy 
app.get('/UserPassword/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });
    const passwordRepository = getRepository(UserPassword, 'auth');
    const pwd = await passwordRepository.findOne({ where: { user_id: userId } as any });
    if (!pwd) return res.status(404).json({ error: 'Password record not found' });
    res.json(pwd);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});