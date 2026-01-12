import 'reflect-metadata';
import bcrypt from 'bcrypt';
import express from 'express';
import { createConnection, getRepository, getConnection } from 'typeorm';
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
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SocialBaza API</title>
      <style>
        body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
        h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        .group { margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
        .group h2 { margin-top: 0; font-size: 1.2rem; color: #555; }
        ul { list-style: none; padding: 0; }
        li { margin-bottom: 8px; display: flex; align-items: center; }
        .method { font-weight: bold; font-size: 0.8rem; padding: 4px 8px; border-radius: 4px; margin-right: 10px; width: 50px; text-align: center; }
        .get { background-color: #e7f5ff; color: #007bff; border: 1px solid #007bff; }
        .post { background-color: #e6fffa; color: #00a082; border: 1px solid #00a082; }
        a { text-decoration: none; color: #333; font-weight: 500; }
        a:hover { text-decoration: underline; color: #0056b3; }
        .note { font-size: 0.85rem; color: #777; margin-left: 10px; }
      </style>
    </head>
    <body>
      <h1>SocialBaza API - Mapa Endpointów</h1>
      
      <div class="group">
        <h2>Użytkownicy (Users & Profiles)</h2>
        <ul>
          <li><span class="method get">GET</span> <a href="/User">/User</a> <span class="note">- Wszyscy użytkownicy</span></li>
          <li><span class="method get">GET</span> <a href="/User/1">/User/:id</a> <span class="note">- Przykładowy user ID=1</span></li>
          <li><span class="method get">GET</span> <a href="/User/username/jan_kowalski">/User/username/:username</a> <span class="note">- Szukanie po nicku</span></li>
          <li><span class="method get">GET</span> <a href="/User/search/jan">/User/search/:q</a> <span class="note">- Wyszukiwarka (followers count)</span></li>
          <li><span class="method get">GET</span> <a href="/UserProfile">/UserProfile</a> <span class="note">- Wszystkie profile</span></li>
          <li><span class="method get">GET</span> <a href="/UserProfile/1">/UserProfile/:userId</a> <span class="note">- Profil konkretnego usera</span></li>
        </ul>
      </div>

      <div class="group">
        <h2>Posty (Posts & Feed)</h2>
        <ul>
          <li><span class="method get">GET</span> <a href="/Post">/Post</a> <span class="note">- Wszystkie posty</span></li>
          <li><span class="method get">GET</span> <a href="/Post/1">/Post/:id</a> <span class="note">- Szczegóły posta</span></li>
          <li><span class="method post">POST</span> <span>/Post</span> <span class="note">- Dodawanie posta (wymaga JSON, użyj cURL/Postman)</span></li>
          <li><span class="method get">GET</span> <a href="/Feed/2">/Feed/:userId</a> <span class="note">- Feed dla usera ID=2 (posty obserwowanych)</span></li>
        </ul>
      </div>

      <div class="group">
        <h2>Interakcje (Comments, Likes, Follows)</h2>
        <ul>
          <li><span class="method get">GET</span> <a href="/Comment">/Comment</a> <span class="note">- Wszystkie komentarze</span></li>
          <li><span class="method get">GET</span> <a href="/Comment/post/1">/Comment/post/:postId</a> <span class="note">- Komentarze do posta ID=1</span></li>
          <li><span class="method get">GET</span> <a href="/Like">/Like</a> <span class="note">- Wszystkie lajki</span></li>
          <li><span class="method get">GET</span> <a href="/Like/post/1">/Like/post/:postId</a> <span class="note">- Lajki posta ID=1</span></li>
          <li><span class="method get">GET</span> <a href="/Follow">/Follow</a> <span class="note">- Wszystkie relacje obserwowania</span></li>
        </ul>
      </div>

      <div class="group">
        <h2>Bezpieczeństwo (Auth)</h2>
        <ul>
          <li><span class="method get">GET</span> <a href="/UserPassword">/UserPassword</a> <span class="note">- Lista haseł (hashy)</span></li>
          <li><span class="method get">GET</span> <a href="/UserPassword/1">/UserPassword/:userId</a> <span class="note">- Hasło usera ID=1</span></li>
        </ul>
      </div>

    </body>
    </html>
  `;
  res.send(html);
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

// get user by id
app.get('/User/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'Invalid id' });
    const userRepository = getRepository(User, 'main');
    const user = await userRepository.findOne({ where: { user_id: id }, relations: ['posts', 'comments', 'likes'] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// get user by username/username
app.get('/User/username/:username', async (req, res) => {
  try {
    const username = req.params.username;
    if (!username) return res.status(400).json({ error: 'Invalid username' });
    const userRepository = getRepository(User, 'main');
    const user = await userRepository.findOne({ where: { username: username }, relations: ['posts', 'comments', 'likes'] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// search users with follower count
app.get('/User/search/:q', async (req, res) => {
  try {
    const q = req.params.q;
    if (!q) return res.status(400).json({ error: 'Invalid query' });
    const userRepository = getRepository(User, 'main');
    const sql = `
      SELECT u.user_id, u.username,
        up."avatarUrl" AS avatar_url,
        up."bio",
        (SELECT COUNT(*) FROM follows f WHERE f.followed_id = u.user_id) AS follower_count
      FROM users u
      INNER JOIN user_profile up ON u.user_id = up."userId"
      WHERE u.username ILIKE '%' || $1 || '%'
        OR up."bio" ILIKE '%' || $1 || '%'
        OR up."website" ILIKE '%' || $1 || '%'
      ORDER BY follower_count DESC, u.username
      LIMIT 10;`;

    const results = await userRepository.query(sql, [q]);
    res.json(results);
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

// create post with validation inside a transaction
app.post('/Post', async (req, res) => {
  // 1. Walidacja danych wejściowych
  const { user_id, content } = req.body;
  if (!user_id || typeof content !== 'string' || content.trim() === '') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const connection = getConnection('main');
  const queryRunner = connection.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const entityManager = queryRunner.manager;

    // 2. Sprawdzenie, czy użytkownik istnieje
    const user = await entityManager.findOne(User, { where: { user_id } });
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Tworzenie posta
    const newPost = new Post();
    newPost.user_id = user_id;
    newPost.content = content;
    
    // Daty nadal musimy ustawić (chyba że w bazie też ustawiłeś DEFAULT NOW())
    newPost.created_at = new Date();
    newPost.updated_at = new Date();

    // 4. Zapis do bazy
    // TypeORM wyśle zapytanie INSERT bez ID, a baza nada kolejny numer
    const savedPost = await entityManager.save(Post, newPost);

    await queryRunner.commitTransaction();
    
    // Zwracamy zapisany obiekt (będzie zawierał nowe post_id nadane przez bazę)
    return res.status(201).json(savedPost);

  } catch (err) {
    await queryRunner.rollbackTransaction();

    // Obsługa błędów
    const errorObj = err as Error;
    
    if (errorObj.message === 'User not found') {
      return res.status(404).json({ error: errorObj.message });
    }

    console.error('Transaction error:', errorObj);
    return res.status(500).json({ error: 'Could not create post' });
  } finally {
    await queryRunner.release();
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

// Home feed: posts from users followed by :userId with counts
app.get('/Feed/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    if (Number.isNaN(userId)) return res.status(400).json({ error: 'Invalid userId' });
    const postRepository = getRepository(Post, 'main');
    const sql = `
      SELECT p.post_id, p.content, p.created_at,
        u.username AS author_username,
        up."avatarUrl" AS author_avatar,
        COUNT(DISTINCT l.like_id) AS like_count,
        COUNT(DISTINCT c.comment_id) AS comment_count
      FROM posts p
      INNER JOIN users u ON p.user_id = u.user_id
      INNER JOIN user_profile up ON u.user_id = up."userId"
      INNER JOIN follows f ON f.followed_id = u.user_id
      LEFT JOIN likes l ON p.post_id = l.post_id
      LEFT JOIN comments c ON p.post_id = c.post_id
      WHERE f.follower_id = $1
      GROUP BY p.post_id, p.content, p.created_at, u.user_id, u.username, up."avatarUrl"
      ORDER BY p.created_at DESC
      LIMIT 20;`;

    const feed = await postRepository.query(sql, [userId]);
    res.json(feed);
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

// Rejestracja nowego użytkownika
app.post('/User', async (req, res) => {
  // 1. Walidacja danych wejściowych
  const { username, email, password, bio, avatarUrl, location, website } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }

  // Połączenie do obu baz
  const mainConnection = getConnection('main');
  const authConnection = getConnection('auth');

  const queryRunner = mainConnection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const entityManager = queryRunner.manager;

    // 2. Sprawdzenie unikalności 
    const existingUserCount = await entityManager.count(User, {
      where: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUserCount > 0) {
      throw new Error('Username or Email already taken');
    }

    // 3. Tworzenie Użytkownika (Tabela Users - baza Main)
    const newUser = new User();
    newUser.username = username;
    newUser.email = email;
    newUser.is_admin = false;

    // Zapisujemy w transakcji, aby baza nadała ID
    const savedUser = await entityManager.save(User, newUser);
    const newUserId = savedUser.user_id; 

    console.log(`[DEBUG] Utworzono usera w bazie Main. ID: ${newUserId}`);

    // 4. Tworzenie Profilu (Tabela UserProfile - baza Main)
    const newProfile = new UserProfile();
    newProfile.userId = newUserId;
    newProfile.bio = bio || '';
    newProfile.avatarUrl = avatarUrl || null;
    newProfile.location = location || null;
    newProfile.website = website || null;

    await entityManager.save(UserProfile, newProfile);

    // 5. Zapisywanie Hasła (Tabela UserPassword - baza Auth)
    try {
      const passwordRepo = authConnection.getRepository(UserPassword);
      
      // --- HASHOWANIE HASŁA ---
      const saltRounds = 10; // Siła szyfrowania
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      // ------------------------

      const newPass = new UserPassword();
      newPass.user_id = newUserId; 
      
      // Zapisujemy ZAHASHOWANE hasło
      newPass.password_hash = hashedPassword; 

      await passwordRepo.save(newPass);
      console.log(`[DEBUG] Zapisano bezpieczne hasło w bazie Auth dla user_id: ${newUserId}`);

    } catch (authError) {
      console.error('Błąd zapisu hasła w bazie Auth:', authError);
      throw new Error('Failed to save password security data');
    }

    // 6. zatwierdzamy zmiany w bazie Main
    await queryRunner.commitTransaction();

    res.status(201).json({
      message: 'User created successfully',
      user: savedUser,
      profile: newProfile
    });

  } catch (err) {
    // jeżeli błąd cofamy zmiany w Users i UserProfile
    await queryRunner.rollbackTransaction();

    const errorObj = err as Error;
    console.error('Registration transaction rolled back. Reason:', errorObj.message);

    if (errorObj.message === 'Username or Email already taken') {
      return res.status(409).json({ error: errorObj.message });
    }

    res.status(500).json({ error: errorObj.message || 'Could not create user' });
  } finally {
    await queryRunner.release();
  }
});

// Logowanie użytkownika
app.post('/Login', async (req, res) => {
  const { username, password } = req.body;
  // 1. Walidacja danych wejściowych
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const mainConnection = getConnection('main');
    const authConnection = getConnection('auth');

    // 2. Pobieramy użytkownika z bazy głównej
    const userRepo = mainConnection.getRepository(User);
    const user = await userRepo.findOne({ where: { username: username } });

    if (!user) {

      return res.status(401).json({ error: 'Invalid username or password' });
    }
    // 3. Pobieramy hash hasła z Bazy Auth
    const passRepo = authConnection.getRepository(UserPassword);
    const authData = await passRepo.findOne({ where: { user_id: user.user_id } });

    if (!authData) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // 4. Weryfikujemy hasło za pomocą bcrypt
    const isPasswordValid = await bcrypt.compare(password, authData.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }


    res.json({
      message: 'Login successful!',
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});