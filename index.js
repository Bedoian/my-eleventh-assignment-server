const express=require('express')
const { MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
const app=express()
const port = process.env.PORT || 5000;
require('dotenv').config();
const cors=require('cors');


// middleware
app.use(express.json())
app.use(cors())



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

    app.post('/items',async(req,res)=>{
        const newItem=req.body
        const result=await itemCollection.insertOne(newItem)
        res.send(result)
    })

    app.get('/items',async(req,res)=>{
        const result=await itemCollection.find().toArray()
        res.send(result)
    })

    app.get('/items/:email',async(req,res)=>{
    const email=req.params.email;
    const query={'buyer.email':email}
    const result=await itemCollection.find(query).toArray()
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



app.get('/',async(req,res)=>{
    res.send('I am looking for a pizza')
})

app.listen(port,()=>{
    console.log(`my server is running on the port: ${port}`);
})