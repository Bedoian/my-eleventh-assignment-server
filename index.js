const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
require('dotenv').config();
const cors = require('cors');


const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://my-eleventh-assignment-c2ba2.web.app'
  ],
  credentials: true,
  optionSuccessStatus: 200,
}
// middleware
app.use(express.json())
app.use(cors(corsOptions))
app.use(cookieParser())

// varify jwt middleware
const varifyToken = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).send({ message: 'unauthorized access' })
  if (token) {
    jwt.verify(token, process.env.SECRET_TOKEN_KEY, (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(401).send({ message: 'unauthorized access' })
      }
      // console.log(decoded)
      req.user = decoded
      next()
    })
  }
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jxt94sc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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



    const itemCollection = client.db("FoodDB").collection("foods")
    const purchaseCollection = client.db('FoodDB').collection('purchase')
    const reviewCollection = client.db('FoodDB').collection('review')

    // generate jwt
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.SECRET_TOKEN_KEY, {
        expiresIn: '10h'
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
        })
        .send({ success: true })
    })

    // clear jwt token
    app.get('/logout', (req, res) => {
      res
        .clearCookie('token', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          maxAge: 0,
        })
        .send({ success: true })
    })

    // post item 
    app.post('/items', async (req, res) => {
      const newItem = req.body
      const result = await itemCollection.insertOne(newItem)
      res.send(result)
    })
    // get all page item
    app.get('/all-items', async (req, res) => {
      const size = parseInt(req.query.size)
      const page = parseInt(req.query.page) - 1
      const filter = req.query.filter;
      const sort = req.query.sort
      const search = req.query.search;
      let query = {
        // name: { $regex: {}, $options: 'i' }
      }
      if (filter) query = { category: filter }
      let options = {}
      if (sort) options = {
        sort: {
          price: sort === 'asc' ? 1 : -1
        }
      }
      const result = await itemCollection
        .find(query, options)
        .skip(page * size)
        .limit(size)
        .toArray()
      res.send(result)

    })
    // get all page count
    app.get('/items-count', async (req, res) => {
      const filter = req.query.filter;
      const search = req.query.search;
      let query = {
        // name: { $regex: search, $options: 'i' }
      }
      if (filter) query = { category: filter }
      const count = await itemCollection.countDocuments(query)
      res.send({ count })
    })

    app.get('/items/:id', async (req, res) => { 
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await itemCollection.findOne(query)
      res.send(result)
    })

    app.get('/items/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'buyer.email': email }
      const result = await itemCollection.find(query).toArray()
      res.send(result)
    })

    // post oparation of purchase collection

    app.post('/myPurchase', async (req, res) => {
      const newPurchase = req.body
      const result = await purchaseCollection.insertOne(newPurchase)
      res.send(result)
    })

    // for email query
    app.get('/myAddedItem', async (req, res) => {
      const result = await itemCollection.find().toArray()
      res.send(result)
    })
    // single email query item 
    app.get('/myAddedItem/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await itemCollection.findOne(query)
      res.send(result)
    })
    // my added item
    app.get('/myAdded/:email', varifyToken, async (req, res) => {
      const tokenEmail = req.user.email
      const email = req.params.email
      if (tokenEmail !== email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { 'buyer.email': email }
      const result = await itemCollection.find(query).toArray()
      res.send(result)
    })
    //update added items
    app.put('/myAddedItem/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const itemData = req.body;
      const updatedDoc = {
        $set: {
          ...itemData
        }
      }
      const result = await itemCollection.updateOne(query, updatedDoc, options)
      res.send(result)
    })

    // get purchase item depending on the email
    app.get('/purchaseItem/:email', async (req, res) => {
      const email = req.params.email;
      const query = { 'buyer.email': email }
      const result = await purchaseCollection.find(query).toArray()
      res.send(result)
    })

    // delete my purchase data
    app.delete('/purchase/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await purchaseCollection.deleteOne(query)
      res.send(result)
    })
    // post review
    app.post('/review', async (req, res) => {
      const newReview = req.body;
      const result = await reviewCollection.insertOne(newReview)
      res.send(result)
    })
    // get review
    app.get('/review', async (req, res) => {
      const result = await reviewCollection.find().toArray()
      res.send(result)
    })





    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', async (req, res) => {
  res.send('I am looking for a pizza')
})

app.listen(port, () => {
  console.log(`my server is running on the port: ${port}`);
})