const express = require('express');
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/mongo');


const app = express();
app.use(express.json());

var db = [];

app.get('/', (req, res) => {
  res.json(db);
});

app.post('/registro', (req, res) => {
  const { user, pass, email, tarjeta } = req.body;
  if (user === undefined || pass === undefined || email === undefined || tarjeta === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.user === user);
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

  db.push({ user, pass, email, monto: 0, tarjeta, historial: []});
  res.json({
    message: 'Usuario registrado'
  });
});

app.post('/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === undefined || pass === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.user === user);
  if (!userExists) {
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return;
  }
  if (userExists.pass !== pass) {
    res.status(400).json({
      message: 'La contraseña es incorrecta'
    });
    return;
  }
  res.json({
    message: 'Usuario logueado'
  });
});

app.post('/recarga', (req, res) => {
  const { monto, tarjeta } = req.body;
  if (monto === undefined || tarjeta === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.tarjeta === tarjeta);
  if (!userExists) {
    res.status(400).json({
      message: 'La tarjeta no existe'
    });
    return;
  }
  userExists.monto += monto;
  userExists.historial.push({
    movimiento: 'Recarga',
    monto: monto,
    usuario: '-',
    glosa: '-'
  });
  res.json({
    message: 'Recarga exitosa'
  });
});

app.post('/transferir', (req, res) => {
  const {user, mail, monto, glosa} = req.body;
  if (user === undefined || mail === undefined || monto === undefined || glosa === undefined) {
    res.status(400).json({
      message: 'Faltan datos'
    });
    return;
  }
  const userExists = db.find((u) => u.user === user);
  if (!userExists) {
    res.status(400).json({
      message: 'El usuario no existe'
    });
    return;
  }
  const emailExists = db.find((u) => u.email === mail);
  if (!emailExists) {
    res.status(400).json({
      message: 'El email no existe'
    });
    return;
  }
  if (userExists.monto < monto) {
    res.status(400).json({
      message: 'No tienes saldo suficiente'
    });
    return;
  }
  userExists.monto -= monto;
  emailExists.monto += monto;
  userExists.historial.push({
    movimiento: 'Envío dinero',
    monto: monto,
    usuario: emailExists.email,
    glosa: glosa
  });
  emailExists.historial.push({
    movimiento: 'Dinero recibido',
    monto: monto,
    usuario: userExists.email,
    glosa: glosa
  });
  res.json({
    message: 'Transferencia exitosa',
    glosa: glosa
  });

});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});