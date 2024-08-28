const express = require('express');
const cors = require('cors');
// const SSLCommerzPayment = require('sslcommerz-lts')
const port = process.env.PORT || 5000;
require('dotenv').config();

const app = express();

//middleware
app.use(cors());
app.use(express.json());

// 
// 


const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.efsdsdy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const usersCollection = client.db('ghoreBahireLearning').collection('users');
    const courseCollection = client.db('ghoreBahireLearning').collection('courses');

    //course Related code
    app.post('/courses', async(req, res) => {
      await client.connect();
      const course = req.body;
      console.log(course);
      const result = await courseCollection.insertOne(course);
      res.send(result);
    })

    app.get('/courses', async(req, res) => {
      await client.connect();
      const query = {};
      const result = await courseCollection.find(query).toArray();
      res.send(result);
    });

    app.get('/my-courses', async(req, res) => {
      await client.connect();
      const email = req.query.email;
      console.log(email)
      const query = {};
      const allCourse = await courseCollection.find(query).toArray();
      let myCourses = [];
      allCourse.forEach(course => {
        console.log(course.teacherProfile.email);
        console.log((JSON.stringify(course.teacherProfile.email) === (email)))
        if (JSON.stringify(course.teacherProfile.email) === (email)) {
          myCourses = [...myCourses, course]
        }
      })

      res.send(myCourses)
    })

    //user related code
    app.get('/users', async (req, res) => {
      await client.connect()
      const query = {}
      const result = await usersCollection.find(query).toArray()
      res.send(result)
    })
    app.post('/users', async (req, res) => {
      await client.connect();
      const user = req.body;
      const query = { email: user.email };
      const already = await usersCollection.findOne(query);
      if (already) {
        return res.send({ acknowledged: false });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result); 
    });

    app.get("/users/teacher/:email", async (req, res) => {
      await client.connect();
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isTeacher: user?.role === "teacher" });
    });

    app.get('/login-user', async (req,res) => {
      await client.connect();
      const email = req.query.email;
      const query = {email};
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    app.put('/edit-profile', async(req, res) => {
      await client.connect();
      const email = req.query.email;
      const userInfo = req.body;
      const query = {email};
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          name: userInfo.name,
          userInfo: userInfo
        }
      }
      const result = await usersCollection.updateOne(query, updatedDoc, options);
      res.send(result);
    })

    app.put('/edit-profile-picture', async(req, res) => {
      await client.connect();
      const email = req.query.email;
      const userInfo = req.body;
      const query = {email};
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          image: userInfo.photoURL,
        }
      }
      const result = await usersCollection.updateOne(query, updatedDoc, options);
      res.send(result);
    })

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
