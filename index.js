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


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    })

    app.get('/my-courses', async(req, res) => {
      await client.connect();
      const email = req.query.email;
      console.log(email)
      const query = {};
      const allCourse = await courseCollection.find(query).toArray();
      let myCourses = [];
      allCourse.forEach(course => {
        console.log(course.teacherProfile.email);
        console.log((JSON.stringify(course.teacherProfile.email) === JSON.stringify(email)))
        if (JSON.stringify(course.teacherProfile.email) === JSON.stringify(email)) {
          myCourses = [...myCourses, course]
        }
      })
      console.log(myCourses)

      res.send(myCourses)
    });

    app.get('/course/:id', async (req, res) => {
      await client.connect();
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await courseCollection.findOne(query)
      res.send(result);
    })

    app.get('/course-edit/:id', async (req, res) => {
      await client.connect();
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await courseCollection.findOne(query);
      res.send(result);
    });

    app.put('/add-weeks/:id', async(req, res) => {
      await client.connect();
      const id = req.params.id;
      const week = req.body;
      const query = {_id: new ObjectId(id)};
      const course = await courseCollection.findOne(query);
      const weeks = course.weeks;
      console.log(weeks)
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          weeks: [...weeks,week]
        }
      }
      const result = await courseCollection.updateOne(query, updatedDoc, options);
      res.send(result);
    });

    app.put('/add-member/:id', async(req, res) => {
      await client.connect();
      const id = req.params.id;
      const courseStudent = req.body;
      const query = {_id: new ObjectId(id)};
      const course = await courseCollection.findOne(query);
      const courseStudents = course.courseStudents;
      console.log(courseStudents)
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          courseStudents: [...courseStudents,courseStudent]
        }
      }
      const result = await courseCollection.updateOne(query, updatedDoc, options);
      res.send(result);
    });

    app.put('/add-rationale/:id', async(req, res) => {
      await client.connect();
      const id = req.params.id;
      const info = req.body;
      const query = {_id: new ObjectId(id)};
      const course = await courseCollection.findOne(query);
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          rationale: info.rationale
        }
      }
      const result = await courseCollection.updateOne(query, updatedDoc, options);
      res.send(result);
    });

    app.get('/my-added-course', async (req, res) => {
      await client.connect();
      console.log('called')
      const email = req.query.email;
      console.log(email)
      const query = {}
      const allCourse = await courseCollection.find(query).toArray();
      let myCourses = [];
      allCourse.forEach(course => {
       course.courseStudents.map(student => {
        console.log(JSON.stringify(student.email) === JSON.stringify(email))
        if (JSON.stringify(student.email) === JSON.stringify(email)){
          myCourses = [...myCourses, course];
        }
       })
      })

      res.send(myCourses) 
    });

    app.get('/user/isJoin/:id', async (req, res) => {
      await client.connect();
      console.log('clicked for is join');
      
      const id = req.params.id;
      const email = req.query.email;
      const query = { _id: new ObjectId(id) };
      const course = await courseCollection.findOne(query);
  
      let isJoin = false;
  
      // Use a simple loop to allow for breaking out early
      for (let student of course.courseStudents) {
          if (JSON.stringify(student.email) === JSON.stringify(email)) {
              isJoin = true;
              break;
          }
      }
  
      // Send a single response based on the condition
      res.send({ isJoin });
  });

  // app.put('/add-task/:id', async(req, res) => {
  //   await client.connect()
  //   const id = req.params.id;
  //   const week = req.query.week;
  //   console.log(week)
  //   const task = req.body;
  //   const query = {_id: new ObjectId(id)};
  //   const course = await courseCollection.findOne(query);
  //   const weeks = course.weeks;
  //   weeks.map((wee, index) => {
  //     console.log(index === parseInt(week))
  //     if(index === parseInt(week)){
  //       wee.tasks.push(task)
  //       console.log(wee)
  //       return res.send({acknowledged: true})
  //     }
  //   })
  //   res.send({acknowledged: false})
  // })

  app.put('/add-task/:id', async (req, res) => {
    await client.connect();
    const id = req.params.id;
    const weekIndex = parseInt(req.query.week); // Convert week query param to an integer
    const task = req.body;

    try {
        const query = { _id: new ObjectId(id) };
        const course = await courseCollection.findOne(query);

        if (!course) {
            return res.status(404).send({ acknowledged: false, message: 'Course not found' });
        }

        const weeks = course.weeks;

        // Ensure the weekIndex is within bounds
        if (weekIndex < 0 || weekIndex >= weeks.length) {
            return res.status(400).send({ acknowledged: false, message: 'Invalid week index' });
        }

        const week = weeks[weekIndex];

        // Initialize tasks if it doesn't exist
        if (!week.tasks) {
            week.tasks = [];
        }

        // Add the new task to the week's tasks
        week.tasks.push(task);

        // Update the course in the database
        const result = await courseCollection.updateOne(
            { _id: new ObjectId(id), "weeks.title": week.title },
            { $set: { "weeks.$.tasks": week.tasks } }
        );

        if (result.modifiedCount > 0) {
            return res.send({ acknowledged: true });
        } else {
            return res.status(500).send({ acknowledged: false, message: 'Failed to add task' });
        }
    } catch (error) {
        console.error(error)
        res.status(500).send({ acknowledged: false, message: 'Server error' });
    } finally {
        
    }
});
  app.get('/view-task/:id', async (req, res) => {
    await client.connect();
    const id = req.params.id;
    const weekIndex = parseInt(req.query.week); // Convert week query param to an integer
    const task = req.body;

    try {
        const query = { _id: new ObjectId(id) };
        const course = await courseCollection.findOne(query);

        if (!course) {
            return res.status(404).send({ acknowledged: false, message: 'Course not found' });
        }

        const weeks = course.weeks;

        // Ensure the weekIndex is within bounds
        if (weekIndex < 0 || weekIndex >= weeks.length) {
            return res.status(400).send({ acknowledged: false, message: 'Invalid week index' });
        }

        const week = weeks[weekIndex];

        // Initialize tasks if it doesn't exist
        if (!week.tasks) {
            week.tasks = [];
        }

        // Add the new task to the week's tasks
        res.send(week.tasks)
    } catch (error) {
        console.error(error)
        res.status(500).send({ acknowledged: false, message: 'Server error' });
    } finally {
        
    }
});

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

    app.get("/users/admin/:email", async (req, res) => {
      await client.connect();
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
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
    });

    app.put("/users/update/:email", async(req, res) =>{
      await client.connect();
      const action = req.query.action;
      console.log(action)
      const email = req.params.email;
      const filter = {email: email}
      const user = await usersCollection.findOne(filter);
      const option = { upsert: true };
      let updatedDoc = {};
      if(action === 'admin'){
        const meet = req.body;
        updatedDoc = {
          $set: {
            role: 'admin',
          },
        };
      }
      else if(action === 'teacher'){
        updatedDoc = {
          $set: {
            role: 'teacher',
          },
        };
      }
      else if(action === 'delete'){
        updatedDoc = {
          $set: {
            role: 'user',
          },
        };
      }
      else{
        updatedDoc = {
          $set: {
            role: 'user',
          },
        };
      }
      const result = await usersCollection.updateOne(
        filter,
        updatedDoc,
        option
      );
      res.send({acknowledged: true});
    });

    app.get('/single-user', async(req, res) => {
      await client.connect();
      const email = req.query.email;
      const query = {email};
      const result = await usersCollection.findOne(query);
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
