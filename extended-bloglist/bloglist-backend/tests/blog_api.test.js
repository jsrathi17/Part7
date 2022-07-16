const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const helper = require("./test_helper");
const config = require("../utils/config");
const Blog = require("../models/blog");
const User = require("../models/user");

beforeEach(async () => {
  await Blog.deleteMany({});
  await Blog.insertMany(helper.initialBlogs);
});

describe("blogs exists", () => {
  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("those are identified by field id", async () => {
    const response = await api.get("/api/blogs");

    const ids = response.body.map((blog) => blog.id);

    for (const id of ids) {
      expect(id).toBeDefined();
    }
  });
});

describe("blogs can be added", () => {
  let token = null;
  beforeAll(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("12345", 10);
    const user = await new User({ username: "name", passwordHash }).save();

    const userForToken = { username: "name", id: user.id };
    return (token = jwt.sign(userForToken, config.SECRET));
  });

  test("blog added by authorized user", async () => {
    const newBlog = {
      title: "a blog",
      author: "the author",
      url: "https://www.example.com",
      likes: 10,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const finalblogs = await helper.blogsInDb();
    expect(finalblogs).toHaveLength(helper.initialBlogs.length + 1);

    const titles = finalblogs.map((blog) => blog.title);
    expect(titles).toContain("a blog");
  });

  test("likes property defaults to 0 if missing", async () => {
    const newBlog = {
      title: "ahhhhh",
      author: "baaaaaaaaa",
      url: "https://www.example.com",
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const finalblogs = await helper.blogsInDb();
    expect(finalblogs).toHaveLength(helper.initialBlogs.length + 1);
    expect(finalblogs[finalblogs.length - 1].likes).toBe(0);
  });

  test("status 400 if title and url are missing", async () => {
    const newBlog = {
      likes: 1,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(400);

    const finalblogs = await helper.blogsInDb();
    expect(finalblogs).toHaveLength(helper.initialBlogs.length);
  });
});

describe("blog can be deleted", () => {
  let token = null;
  beforeEach(async () => {
    await Blog.deleteMany({});
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash("password", 10);
    const user = await new User({ username: "name", passwordHash }).save();

    const userForToken = { username: "name", id: user.id };
    token = jwt.sign(userForToken, config.SECRET);

    const newBlog = {
      title: "Jayshree's blog",
      author: "Jayshree Rathi",
      url: "https://www.jsrathi.com",
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    return token;
  });

  test("status code 204 if id exists", async () => {
    const initialBlogs = await Blog.find({}).populate("user");
    const blogToDelete = initialBlogs[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const finalblogs = await Blog.find({}).populate("user");
    expect(finalblogs).toHaveLength(initialBlogs.length - 1);

    const titles = finalblogs.map((blog) => blog.title);
    expect(titles).not.toContain(blogToDelete.title);
  });

  test("status code 401 if user not authorized", async () => {
    const initialBlogs = await Blog.find({}).populate("user");
    const blogToDelete = initialBlogs[0];

    token = null;

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(401);

    const finalblogs = await Blog.find({}).populate("user");

    expect(finalblogs).toHaveLength(initialBlogs.length);
    expect(initialBlogs).toEqual(finalblogs);
  });
});

describe("blog can be updated", () => {
  test("status 200 if id exists", async () => {
    const initialBlogs = await helper.blogsInDb();
    const updatedBlog = initialBlogs[0];

    await api
      .put(`/api/blogs/${updatedBlog.id}`)
      .send({ likes: 10 })
      .expect(200);

    const finalblogs = await helper.blogsInDb();
    const updatedBlog = finalblogs[0];
    expect(finalblogs).toHaveLength(helper.initialBlogs.length);
    expect(updatedBlog.likes).toBe(10);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
