const express = require('express');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const transferirLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://publicGithubAuth:3HQaWMwhAu7MVi4n@devweb.or5phdi.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function leerDocumentos() {
  try {
    const database = client.db('apibank');
    const collection = database.collection('usuarios');

    const documents = await collection.find().toArray();
    console.log(documents);
  } catch (e) {
    console.log('Error al leer los documentos');
    console.log(e);
  }
}
async function escribirDocumento() {
  try {
    const database = client.db('apibank');
    const collection = database.collection('usuarios');

    const newDocument = {
      nombre: ' ',
      apellido: ' ',
      edad: ' ',
      saldo: ' ',
    };

    await collection.insertOne(newDocument);
  } catch (e) {
    console.log('Error al escribir el documento');
    console.log(e);
  }
}

async function modificarDocumento() {
  try {
    const database = client.db('apibank');
    const collection = database.collection('usuarios');

    const filter = { nombre: ' ' };
    const update = { $set: { edad: ' ', saldo: ' '} };

    await collection.updateOne(filter, update);
  } catch (e) {
    console.log('Error al modificar el documento');
    console.log(e);
  }
}
async function conectarse(){
  try {
    await client.connect();
    console.log('Conectado con exito');
  }
  catch (e) {
    console.log('Error al conectarse a la base de datos');
    console.log(e);
  }
}
conectarse();

const app = express();
app.use(express.json());

app.get('/', transferirLimiter, (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  const collection = client.db("apibank").collection("usuarios");
  console.log('Collection:', collection);
  collection.find({}).toArray((err, result) => {
    console.log('Error:', err);
    console.log('Result:', result);
    if (err) {
      console.log('Database error');
      res.status(500).json({
        message: 'Error al obtener la base de datos'
      });
      return false;
    }
    console.log('Database result');
    res.json(result);
  });
});

app.post('/ingresar', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  console.log('Request query:', req.query);
  const { email, password } = req.query;
  console.log('Email:', email);
  console.log('Password:', password);
  if (email === undefined || password === undefined) {
    console.log('Missing data');
    res.status(400).json({
      message: 'Faltan datos'
    });
    return false;
  }
  const collection = client.db("apibank").collection("usuarios");
  const userExists = await collection.findOne({ email: { $eq: email } });
  console.log('User exists:', userExists);
  if(!userExists) {
    console.log('User does not exist');
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return false;
  }
  if(userExists.password !== password) {
    console.log('Incorrect password');
    res.status(400).json({
      message: 'La contraseña es incorrecta'
    });
    return false;
  }
  const token = jwt.sign({email: userExists.email}, 'secret');
  console.log('Token:', token);
  const tokensCollection = client.db("apibank").collection("tokens");
  tokensCollection.insertOne({token: token}, (err, result) => {
    if (err) {
      console.log('Error saving token');
      res.status(500).json({
        message: 'Error al guardar el token'
      });
      return false;
    }
    console.log('Token saved');
  });
  res.json({
    message: 'Ingreso exitoso',
    token: token
  });
});

app.get('/salir', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  //read token from header, then delete it from 'tokens' collection
  const token = req.headers['authorization'];
  console.log('Token:', token);
  const tokensCollection = client.db("apibank").collection("tokens");
  tokensCollection.deleteOne({token: token}, (err, result) => {
    if (err) {
      console.log('Error deleting token');
      res.status(500).json({
        message: 'Error al eliminar el token'
      });
      return false;
    }
    console.log('Token deleted');
  }
  );
  res.json({
    message: 'Salida exitosa'
  });
});

app.post('/usuario', transferirLimiter, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  const { name, email, password } = req.query;
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Password received');
  if (name === undefined || email === undefined || password === undefined) {
    console.log('Missing data');
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const collection = client.db("apibank").collection("usuarios");
  if (typeof name !== "string") {
    console.log('Invalid name');
    res.status(400).json({
      message: 'Nombre no válido'
    });
    return;
  }
  const userExists = await collection.findOne({ name: { $eq: name } });
  console.log('User exists:', userExists);
  if (userExists) {
    console.log('User already exists');
    res.status(400).json({
      message: 'El usuario ya existe'
    });
    return;
  }
  const emailExists = await collection.findOne({ email: { $eq: email } });
  console.log('Email exists:', emailExists);
  if (emailExists) {
    console.log('Email already exists');
    res.status(400).json({
      message: 'El email ya existe'
    });
    return;
  }
  // regex for email
  const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  if (!regex.test(email)) {
    console.log('Invalid email');
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
  const crypto = require('crypto');
  function generateRandomNumber() {
    const randomBytes = crypto.randomBytes(8); // 8 bytes = 64 bits
    let randomNumber = '';
    for (let i = 0; i < randomBytes.length; i++) {
      randomNumber += ('0' + randomBytes[i].toString(10)).slice(-2);
    }
    return randomNumber.slice(0, 16); // Ensure it's a 16-digit number
  }
  const credit_card = generateRandomNumber();
  collection.insertOne({ name, email, password, amount: 0, credit_card, movements: [] });
  res.json({
    message: 'Usuario registrado'
  });
});

app.get('/usuario', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  const token = req.headers.authorization;
  console.log('Token:', token);
  if (!token) {
    console.log('Unauthorized');
    res.status(401).json({
      message: 'No autorizado'
    });
    return;
  }
  const tokensCollection = client.db("apibank").collection("tokens");
  const tokenExists = await tokensCollection.findOne({ token: token });
  console.log('Token exists:', tokenExists);
  if (!tokenExists) {
    console.log('Token does not exist');
    res.status(401).json({
      message: 'Token no existe'
    });
    return;
  }
  jwt.verify(token, 'secret', async (err, decoded) => {
    console.log('Error:', err);
    console.log('Decoded:', decoded);
    if (err) {
      console.log('Invalid token');
      res.status(401).json({
        message: 'Token inválido'
      });
      return;
    }
    const collection = client.db("apibank").collection("usuarios");
    console.log('Collection:', collection);
    const userExists = await collection.findOne({ email: decoded.email });
    console.log('User exists:', userExists);
    if (!userExists) {
      console.log('User does not exist');
      res.status(400).json({
        message: 'El usuario no existe'
      });
      return;
    }
    console.log('User found');
    res.json({
      name: userExists.name,
      email: userExists.email,
      amount: userExists.amount,
      credit_card: userExists.credit_card,
    });
  });
});

app.get('/movimientos', transferirLimiter, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  const token = req.headers.authorization;
  console.log('Token:', token);
  if (!token) {
    console.log('Unauthorized');
    res.status(401).json({
      message: 'No autorizado'
    });
    return;
  }
  const tokensCollection = client.db("apibank").collection("tokens");
  const tokenExists = await tokensCollection.findOne({ token: token });
  console.log('Token exists:', tokenExists);
  if (!tokenExists) {
    console.log('Token does not exist');
    res.status(401).json({
      message: 'Token no existe'
    });
    return;
  }
  jwt.verify(token, 'secret', async (err, decoded) => {
    console.log('Error:', err);
    console.log('Decoded:', decoded);
    if (err) {
      console.log('Invalid token');
      res.status(401).json({
        message: 'Token inválido'
      });
      return;
    }
    const collection = client.db("apibank").collection("usuarios");
    console.log('Collection:', collection);
    const userExists = await collection.findOne({ email: decoded.email });
    console.log('User exists:', userExists);
    if (!userExists) {
      console.log('User does not exist');
      res.status(400).json({
        message: 'El usuario no existe'
      });
      return;
    }
    console.log('User found');
    res.json({
      movements: userExists.movements,
    });
  });
});

const retirarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

const recargarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.post('/recargar', recargarLimiter, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  //obtain token from headers
  const token = req.headers.authorization;
  console.log('Token:', token);
  if (!token) {
    console.log('Unauthorized');
    res.status(401).json({
      message: 'No autorizado'
    });
    return;
  }
  const tokensCollection = client.db("apibank").collection("tokens");
  const tokenExists = await tokensCollection.findOne({ token: token });
  console.log('Token exists:', tokenExists);
  if (!tokenExists) {
    console.log('Token does not exist');
    res.status(401).json({
      message: 'Token no existe'
    });
    return;
  }
  jwt.verify(token, 'secret', async (err, decoded) => {
    console.log('Error:', err);
    console.log('Decoded:', decoded);
    if (err) {
      console.log('Invalid token');
      res.status(401).json({
        message: 'Token inválido'
      });
      return;
    }
    const collection = client.db("apibank").collection("usuarios");
    console.log('Collection:', collection);
    const userExists = await collection.findOne({ email: decoded.email });
    console.log('User exists:', userExists);
    if (!userExists) {
      console.log('User does not exist');
      res.status(400).json({
        message: 'El usuario no existe'
      });
      return;
    }
    console.log('User found');
    const { amount } = req.query;
    const movements = userExists.movements;
    console.log('Amount:', amount);
    if (amount === undefined) {
      console.log('Missing data');
      res.status(400).json({
        message: 'Faltan datos'
      });
      return;
    }
    const { credit_card } = req.query;
    console.log('Credit card:', credit_card);
    if (credit_card === undefined) {
      console.log('Missing credit card');
      res.status(400).json({
        message: 'Falta tarjeta de crédito'
      });
      return;
    }
    if(credit_card === userExists.credit_card) {
      console.log('Credit card is from same account');
      res.status(400).json({
        message: 'No puedes usar la misma tarjeta de crédito, usa otra'
      });
      return;
    }
    const newAmount = parseInt(userExists.amount) + parseInt(amount);
    const newMovement = {
      amount: parseInt(amount),
      email: decoded.email,
      comment: 'Recarga',
    };
    console.log('New amount:', newAmount);
    const result = await collection.updateOne(
      { email: decoded.email },
      { $set: { amount: newAmount }, $push: { movements: newMovement } }
    );
    console.log('Result:', result);
    res.json({
      message: 'Recarga exitosa'
    });
  });
});

app.post('/transferir', transferirLimiter, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  const token = req.headers.authorization;
  console.log('Token:', token);
  if (!token) {
    console.log('Unauthorized');
    res.status(401).json({
      message: 'No autorizado'
    });
    return;
  }
  const tokensCollection = client.db("apibank").collection("tokens");
  const tokenExists = await tokensCollection.findOne({ token: token });
  console.log('Token exists:', tokenExists);
  if (!tokenExists) {
    console.log('Token does not exist');
    res.status(401).json({
      message: 'Token no existe'
    });
    return;
  }
  jwt.verify(token, 'secret', async (err, decoded) => {
    console.log('Error:', err);
    console.log('Decoded:', decoded);
    if (err) {
      console.log('Invalid token');
      res.status(401).json({
        message: 'Token inválido'
      });
      return;
    }
    const collection = client.db("apibank").collection("usuarios");
    console.log('Collection:', collection);
    const userFromExists = await collection.findOne({ email: decoded.email });
    if (!userFromExists) {
      console.log('User does not exist');
      res.status(400).json({
        message: 'El usuario origen no existe'
      });
      return;
    }
    const { email, amount, comment } = req.query;
    console.log('Email:', email);
    console.log('Amount:', amount);
    console.log('Comment:', comment);
    if (email === undefined || amount === undefined || comment === undefined) {
      console.log('Missing data');
      res.status(400).json({
        message: 'Faltan datos'
      });
      return;
    }
    if (email === decoded.email) {
      console.log('Cannot transfer to same account');
      res.status(400).json({
        message: 'No puedes transferir a la misma cuenta'
      });
      return;
    }
    if (amount > userFromExists.amount) {
      console.log('Insufficient funds');
      res.status(400).json({
        message: 'Fondos insuficientes'
      });
      return;
    }
    if (amount <= 0) {
      console.log('Invalid amount');
      res.status(400).json({
        message: 'Monto inválido'
      });
      return;
    }
    if (typeof comment !== 'string' || comment.length > 100) {
      console.log('Invalid comment');
      res.status(400).json({
        message: 'Comentario inválido o muy largo'
      });
      return;
    }
    const userToExists = await collection.findOne({ email: { $eq: email } });
    console.log('User to exists:', userToExists);
    if (!userToExists) {
      console.log('User does not exist');
      res.status(400).json({
        message: 'El usuario destino no existe'
      });
      return;
    }
    // Transfer from userFrom to userTo
    const newAmountFrom = parseInt(userFromExists.amount) - parseInt(amount);
    const newMovementFrom = {
      amount: parseInt(amount),
      email: email,
      comment: comment,
    };
    console.log('New amount from:', newAmountFrom);
    const resultFrom = await collection.updateOne(
      { email: decoded.email },
      { $set: { amount: newAmountFrom }, $push: { movements: newMovementFrom } }
    );
    console.log('Result from:', resultFrom);
    const newAmountTo = parseInt(userToExists.amount) + parseInt(amount);
    const newMovementTo = {
      amount: parseInt(amount),
      email: decoded.email,
      comment: comment,
    };
    console.log('New amount to:', newAmountTo);
    const resultTo = await collection.updateOne(
      { email: { $eq: email } },
      { $set: { amount: newAmountTo }, $push: { movements: newMovementTo } }
    );
    console.log('Result to:', resultTo);
    res.json({
      message: 'Transferencia exitosa'
    });
  });
});

app.post('/retirar', retirarLimiter, async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  const token = req.headers.authorization;
  console.log('Token:', token);
  if (!token) {
    console.log('Unauthorized');
    res.status(401).json({
      message: 'No autorizado'
    });
    return;
  }
  const tokensCollection = client.db("apibank").collection("tokens");
  const tokenExists = await tokensCollection.findOne({ token: token });
  console.log('Token exists:', tokenExists);
  if (!tokenExists) {
    console.log('Token does not exist');
    res.status(401).json({
      message: 'Token no existe'
    });
    return;
  }
  jwt.verify(token, 'secret', async (err, decoded) => {
    console.log('Error:', err);
    console.log('Decoded:', decoded);
    if (err) {
      console.log('Invalid token');
      res.status(401).json({
        message: 'Token inválido'
      });
      return;
    }
    const collection = client.db("apibank").collection("usuarios");
    console.log('Collection:', collection);
    const userExists = await collection.findOne({ email: decoded.email });
    if (!userExists) {
      console.log('User does not exist');
      res.status(400).json({
        message: 'El usuario no existe'
      });
      return;
    }
    const { amount, credit_card } = req.query;
    console.log('Amount:', amount);
    console.log('Credit card:', credit_card);
    if (amount === undefined || credit_card === undefined) {
      console.log('Missing data');
      res.status(400).json({
        message: 'Faltan datos'
      });
      return;
    }
    if (amount > userExists.amount) {
      console.log('Insufficient funds');
      res.status(400).json({
        message: 'Fondos insuficientes'
      });
      return;
    }
    if (amount <= 0) {
      console.log('Invalid amount');
      res.status(400).json({
        message: 'Monto inválido'
      });
      return;
    }
    if (credit_card.length !== 16) {
      console.log('Invalid credit card');
      res.status(400).json({
        message: 'Tarjeta inválida, debe tener 16 dígitos'
      });
      return;
    }
    if(credit_card !== userExists.credit_card){
      console.log('Invalid credit card');
      res.status(400).json({
        message: 'Tarjeta inválida, no coincide con la registrada'
      });
      return;
    }
    const newAmount = parseInt(userExists.amount) - parseInt(amount);
    const newMovement = {
      amount: parseInt(amount),
      email: decoded.email,
      comment: 'Retiro en cajero',
    };
    console.log('New amount:', newAmount);
    const result = await collection.updateOne(
      { email: decoded.email },
      { $set: { amount: newAmount }, $push: { movements: newMovement } }
    );
    console.log('Result:', result);
    res.json({
      message: 'Retiro exitoso'
    });
  });
});
app.listen(80, () => {
  console.log('Server is running on port 80');
});
