const express = require('express');
const jwt = require('jsonwebtoken');

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://publicGithubAuth:3HQaWMwhAu7MVi4n@devweb.or5phdi.mongodb.net/?retryWrites=true&w=majority";

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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("apibank").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json(db);
});

app.post('/ingresar', (req, res) => {
  const { email, password } = req.body;
  if (email === undefined || password === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return false;
  }
  const userExists = db.find((u) => u.email === email);
  if(!userExists) {
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return false;
  }
  if(userExists.password !== password) {
    res.status(400).json({
      message: 'La contraseña es incorrecta'
    });
    return false;
  }
  //make a authentication token below
  const token = jwt.sign({email: userExists.email}, 'secret');
  res.json({
    message: 'Ingreso exitoso',
    token: token
  });
});

app.post('/usuario', (req, res) => {
  const { name, email, password } = req.body;
  if (name === undefined || email === undefined || password === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.name === name);
  if (userExists) {
    res.status(400).json({
      message: 'El usuario ya existe'
    });
    return;
  }
  const emailExists = db.find((u) => u.email === email);
  if (emailExists) {
    res.status(400).json({
      message: 'El email ya existe'
    });
    return;
  }
  // regex for email
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!regex.test(email)) {
    res.status(400).json({
      message: 'El email no es válido'
    });
    return;
  }

  // regex for credit card
  //const regex2 = /^([0-9]{4}[-]){3}[0-9]{4}$/;
  //if (!regex2.test(tarjeta)) {
    //res.status(400).json({
      //message: 'La tarjeta no es válida'
  //});

  db.push({ name, email, password, monto: 0, tarjeta, historial: []});
  res.json({
    message: 'Usuario registrado'
  });
});


app.post('/recargar', (req, res) => {
  const { amount, credit_card } = req.body;
  if (amount === undefined || credit_card === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.credit_card === credit_card);
  if (!userExists) {
    res.status(400).json({
      message: 'La tarjeta no existe'
    });
    return;
  }
  userExists.amount += amount;
  userExists.historial.push({
    movimiento: 'Recarga',
    amount: amount,
    usuario: '-',
    glosa: '-'
  });
  res.json({
    message: 'Recarga exitosa'
  });
});

app.post('/transferir', (req, res) => {
  const {email, amount, comment} = req.body;
  if (email === undefined || amount === undefined || comment === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.name === name);
  if (!userExists) {
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return;
  }
  const emailExists = db.find((u) => u.email === email);
  if (!emailExists) {
    res.status(400).json({
      message: 'El email no existe'
    });
    return;
  }
  if (userExists.amount < amount) {
    res.status(400).json({
      message: 'No tienes saldo suficiente'
    });
    return;
  }
  userExists.amount -= amount;
  emailExists.amount += amount;
  userExists.historial.push({
    movimiento: 'Envío dinero',
    amount: amount,
    usuario: emailExists.email,
    comment: comment
  });
  emailExists.historial.push({
    movimiento: 'Dinero recibido',
    amount: amount,
    usuario: userExists.email,
    comment: comment
  });
  res.json({
    message: 'Transferencia exitosa',
    comment: comment
  });

});

app.post('/retirar', (req, res) => {
  const { amount, credit_card } = req.body;
  if (amount === undefined || credit_card === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return false;
  }
  const userExists = db.find((u) => u.credit_card === credit_card);
  if (!userExists) {
    res.status(400).json({
      message: 'La tarjeta no existe'
    });
    return false;
  }
  if (userExists.amount < amount) {
    res.status(400).json({
      message: 'No tienes saldo suficiente'
    });
    return false;
  }
  userExists.amount -= amount;
  userExists.historial.push({
    movimiento: 'Retiro',
    amount: amount,
    usuario: '-',
    comment: '-'
  });
  res.json({
    message: 'Retiro exitoso'
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});