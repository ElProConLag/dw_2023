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
  let attempts = 0;
  while (attempts < 3) {
    try {
      // Connect the client to the server (optional starting in v4.7)
      await client.connect();
      // Send a ping to confirm a successful connection
      await client.db("apibank").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
      break;
    } catch (err) {
      attempts++;
      console.error(`Error al conectar con la base de datos (intento ${attempts}):`, err);
      if (attempts >= 3) {
        console.error('Se han agotado los intentos de conexión');
        break;
      }
      console.log(`Reintentando la conexión en 5 segundos (intento ${attempts + 1})...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  if (attempts < 3) {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  const collection = client.db("apibank").collection("usuarios");
  collection.find({}).toArray((err, result) => {
    if (err) {
      res.status(500).json({
        message: 'Error al obtener la base de datos'
      });
      return false;
    }
    res.json(result);
  });
});

app.post('/ingresar', (req, res) => {
  const { email, password } = req.body;
  if (email === undefined || password === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return false;
  }
  const collection = client.db("apibank").collection("usuarios");
  const userExists = collection.findOne({ email: email });
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

app.get('/salir', (req, res) => {
  const token = req.headers.authorization;
  if (token) {
    jwt.verify(token, 'secret', (err, decoded) => {
      if (err) {
        res.status(401).json({
          message: 'Token inválido'
        });
        return false;
      }
      res.json({
        message: 'Sesión cerrada'
      });
    });
  } else {
    const collection = client.db("apibank").collection("tokens");
    collection.deleteMany({}, (err, result) => {
      if (err) {
        res.status(500).json({
          message: 'Error al cerrar la sesión'
        });
        return false;
      }
      res.json({
        message: 'Sesión cerrada'
      });
    });
  }
});

app.post('/usuario', (req, res) => {
  const { name, email, password } = req.body;
  if (name === undefined || email === undefined || password === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const collection = client.db("apibank").collection("usuarios");
  const userExists = collection.findOne({ name: name });
  if (userExists) {
    res.status(400).json({
      message: 'El usuario ya existe'
    });
    return;
  }
  const emailExists = collection.findOne({ email: email });
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

  collection.insertOne({ name, email, password, monto: 0, tarjeta, movements: []});
  res.json({
    message: 'Usuario registrado'
  });
});

app.get('/usuario', (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    res.status(401).json({
      message: 'No autorizado'
    });
    return;
  }
  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) {
      res.status(401).json({
        message: 'Token inválido'
      });
      return;
    }
    const collection = client.db("apibank").collection("usuarios");
    const userExists = collection.findOne({ email: decoded.email });
    if (!userExists) {
      res.status(400).json({
        message: 'El usuario no existe'
      });
      return;
    }
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
  if (!token) {
    res.status(401).json({
      message: 'No autorizado'
    });
    return;
  }
  jwt.verify(token, 'secret', (err, decoded) => {
    if (err) {
      res.status(401).json({
        message: 'Token inválido'
      });
      return;
    }
    const collection = client.db("apibank").collection("usuarios");
    const userExists = collection.findOne({ email: decoded.email });
    if (!userExists) {
      res.status(400).json({
        message: 'El usuario no existe'
      });
      return;
    }
    res.json({
      movements: userExists.movements
    });
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
  const collection = client.db("apibank").collection("usuarios");
  const userExists = collection.findOne({ credit_card: credit_card });
  if (!userExists) {
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
  collection.updateOne({ credit_card: credit_card }, { $set: { amount: userExists.amount, movements: userExists.movements } });
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
  const collection = client.db("apibank").collection("usuarios");
  const userExists = collection.findOne({ email: email });
  if (!userExists) {
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return;
  }
  const emailExists = collection.findOne({ email: email });
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
  collection.updateOne({ email: email }, { $set: { amount: userExists.amount, movements: userExists.movements } });
  collection.updateOne({ email: emailExists.email }, { $set: { amount: emailExists.amount, movements: emailExists.movements } });
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
  const collection = client.db("apibank").collection("usuarios");
  const userExists = collection.findOne({ credit_card: credit_card });
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
  userExists.movements.push({
    movimiento: 'Retiro',
    amount: amount,
    usuario: '-',
    comment: '-'
  });
  collection.updateOne({ credit_card: credit_card }, { $set: { amount: userExists.amount, movements: userExists.movements } });
  res.json({
    message: 'Retiro exitoso'
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});