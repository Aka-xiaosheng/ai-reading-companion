const { initDb } = require('./database');

async function seed() {
  const db = await initDb();
  const { run, save } = db;

  // Book 1: 三体
  run(`INSERT INTO books (title, author, cover_url, total_pages, current_page, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ['三体', '刘慈欣', null, 400, 280, 'reading']
  );
  run(`INSERT INTO notes (book_id, content) VALUES (?, ?)`,
    [1, '文革背景下，叶文洁在红岸基地向宇宙发送了信号，被三体文明接收。这是一个关于文明接触与冲突的故事。']
  );
  run(`INSERT INTO notes (book_id, content) VALUES (?, ?)`,
    [1, '黑暗森林法则：宇宙就是一座黑暗森林，每个文明都是带枪的猎人。一旦某个文明被发现，就必然遭到其他文明的打击。']
  );

  // Book 2: 活着
  run(`INSERT INTO books (title, author, cover_url, total_pages, current_page, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ['活着', '余华', null, 200, 200, 'finished']
  );
  run(`INSERT INTO notes (book_id, content) VALUES (?, ?)`,
    [2, '福贵从地主少爷到一贫如洗，经历了中国近代史的种种苦难，身边的亲人一个个离他而去。']
  );
  run(`INSERT INTO notes (book_id, content) VALUES (?, ?)`,
    [2, '人是为了活着本身而活着，而不是为了活着之外的任何事物而活着。这本书让我重新思考生命的意义。']
  );

  // Book 3: 百年孤独
  run(`INSERT INTO books (title, author, cover_url, total_pages, current_page, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ['百年孤独', '加西亚·马尔克斯', null, 360, 0, 'want_to_read']
  );

  // Book 4: 1984
  run(`INSERT INTO books (title, author, cover_url, total_pages, current_page, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ['1984', '乔治·奥威尔', null, 320, 320, 'finished']
  );
  run(`INSERT INTO notes (book_id, content) VALUES (?, ?)`,
    [4, '反乌托邦经典之作。老大哥在看着你，思想警察无处不在。极权主义通过控制语言来控制思想——新话、双重思想。']
  );

  // Book 5: 红楼梦
  run(`INSERT INTO books (title, author, cover_url, total_pages, current_page, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ['红楼梦', '曹雪芹', null, 960, 450, 'reading']
  );
  run(`INSERT INTO notes (book_id, content) VALUES (?, ?)`,
    [5, '中国古典小说巅峰。贾宝玉、林黛玉、薛宝钗的爱情悲剧，四大家族的兴衰史。满纸荒唐言，一把辛酸泪。']
  );

  save();
  console.log('Seeded 5 books with UTF-8 encoded Chinese text.');
  process.exit(0);
}

seed();
