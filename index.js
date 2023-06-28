const express = require('express');
const jwt = require('jsonwebtoken');

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
    const usuariosCollection = client.db('apibank').collection('usuarios');
    const usuarios = await usuariosCollection.find().toArray();
    console.log(usuarios);
    const nuevoUsuario = { nombre: 'Ejemplo', apellido: 'Usuario' };
    const resultadoInsert = await usuariosCollection.insertOne(nuevoUsuario);
    console.log('Documento insertado:', resultadoInsert.insertedId);
    const filtro = { nombre: 'Ejemplo' };
    const actualizacion = { $set: { apellido: 'Modificado' } };
    const resultadoUpdate = await usuariosCollection.updateOne(filtro, actualizacion);
    console.log('Documento modificado:', resultadoUpdate.modifiedCount);

  }
  catch (e) {
    console.log('Error al conectarse a la base de datos');
    console.log(e);
  }
}
conectarse();
leerDocumentos();
escribirDocumento();
modificarDocumento();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
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

app.post('/ingresar', (req, res) => {
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
  const userExists = collection.findOne({ email: email });
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
  //make a authentication token below
  const token = jwt.sign({email: userExists.email}, 'secret');
  console.log('Token:', token);
  res.json({
    message: 'Ingreso exitoso',
    token: token
  });
});

app.get('/salir', (req, res) => {
  const token = req.headers.authorization;
  console.log('Token:', token);
  if (token) {
    jwt.verify(token, 'secret', (err, decoded) => {
      if (err) {
        console.log('Invalid token');
        res.status(401).json({
          message: 'Token inválido'
        });
        return;
      }
      console.log('Session closed');
      res.json({
        message: 'Sesión cerrada'
      });
    });
  } else {
    const collection = client.db("apibank").collection("tokens");
    collection.deleteMany({}, (err, result) => {
      if (err) {
        console.log('Error closing session');
        res.status(500).json({
          message: 'Error al cerrar la sesión'
        });
        return;
      }
      console.log('Session closed');
      res.json({
        message: 'Sesión cerrada'
      });
    });
  }
});

app.post('/usuario', async (req, res) => {
  const { name, email, password } = req.query;
  console.log('Name:', name);
  console.log('Email:', email);
  console.log('Password:', password);
  if (name === undefined || email === undefined || password === undefined) {
    console.log('Missing data');
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const collection = client.db("apibank").collection("usuarios");
  const userExists = await collection.findOne({ name: name });
  console.log('User exists:', userExists);
  if (userExists) {
    console.log('User already exists');
    res.status(400).json({
      message: 'El usuario ya existe'
    });
    return;
  }
  const emailExists = await collection.findOne({ email: email });
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
  function generateRandomNumber() {
    let randomNumber = '';
    for (let i = 0; i < 16; i++) {
      randomNumber += Math.floor(Math.random() * 10);
    }
    return randomNumber;
  }
  const credit_card = generateRandomNumber();
  collection.insertOne({ name, email, password, monto: 0, credit_card, movements: [] });
  res.json({
    message: 'Usuario registrado'
  });
});

app.get('/usuario', (req, res) => {
  const token = req.headers.authorization;
  console.log('Token:', token);
  if (!token) {
    console.log('Unauthorized');
    res.status(401).json({
      message: 'No autorizado'
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
      movements: userExists.movements
    });
  });
});

app.get('/movimientos', (req, res) => {
  const token = req.headers.authorization;
  console.log('Token:', token);
  if (!token) {
    console.log('Unauthorized');
    res.status(401).json({
      message: 'No autorizado'
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
      movements: userExists.movements
    });
  });
});

app.post('/recargar', async (req, res) => {
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
  const collection = client.db("apibank").collection("usuarios");
  const userExists = await collection.findOne({ credit_card: credit_card });
  console.log('User exists:', userExists);
  if (!userExists) {
    console.log('User does not exist');
    res.status(400).json({
      message: 'La tarjeta no existe'
    });
    return;
  }
  userExists.amount += amount;
  userExists.movements.push({
    movimiento: 'Recarga',
    amount: amount,
    usuario: '-',
    glosa: '-'
  });
  await collection.updateOne({ credit_card: credit_card }, { $set: { amount: userExists.amount, movements: userExists.movements } });
  console.log('User updated');
  res.json({
    message: 'Recarga exitosa'
  });
});

app.post('/transferir', async (req, res) => {
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
  const collection = client.db("apibank").collection("usuarios");
  const userExists = await collection.findOne({ email: email });
  console.log('User exists:', userExists);
  if (!userExists) {
    console.log('User does not exist');
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return;
  }
  const emailExists = await collection.findOne({ email: email });
  console.log('Email exists:', emailExists);
  if (!emailExists) {
    console.log('Email does not exist');
    res.status(400).json({
      message: 'El email no existe'
    });
    return;
  }
  if (userExists.amount < amount) {
    console.log('Insufficient funds');
    res.status(400).json({
      message: 'No tienes saldo suficiente'
    });
    return;
  }
  userExists.amount -= amount;
  emailExists.amount += amount;
  userExists.movements.push({
    movimiento: 'Envío dinero',
    amount: amount,
    usuario: emailExists.email,
    comment: comment
  });
  emailExists.movements.push({
    movimiento: 'Dinero recibido',
    amount: amount,
    usuario: userExists.email,
    comment: comment
  });
  await collection.updateOne({ email: email }, { $set: { amount: userExists.amount, movements: userExists.movements } });
  await collection.updateOne({ email: emailExists.email }, { $set: { amount: emailExists.amount, movements: emailExists.movements } });
  console.log('User and email updated');
  res.json({
    message: 'Transferencia exitosa',
    comment: comment
  });
});

app.post('/retirar', async (req, res) => {
  const { amount, credit_card } = req.query;
  console.log('Amount:', amount);
  console.log('Credit card:', credit_card);
  if (amount === undefined || credit_card === undefined) {
    console.log('Missing data');
    res.status(400).json({
      message: 'Faltan datos'
    });
    return false;
  }
  const collection = client.db("apibank").collection("usuarios");
  const userExists = collection.findOne({ credit_card: credit_card });
  console.log('User exists:', userExists);
  if (!userExists) {
    console.log('User does not exist');
    res.status(400).json({
      message: 'La tarjeta no existe'
    });
    return false;
  }
  if (userExists.amount < amount) {
    console.log('Insufficient funds');
    res.status(400).json({
      message: 'No tienes saldo suficiente'
    });
    return false;
  }
  userExists.amount -= amount;
  userExists.movements.push({
    movimiento: 'Retiro',
    amount: amount,
    usuario: '-',
    comment: '-'
  });
  await collection.updateOne({ credit_card: credit_card }, { $set: { amount: userExists.amount, movements: userExists.movements } });
  console.log('User updated');
  res.json({
    message: 'Retiro exitoso'
  });
});
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
