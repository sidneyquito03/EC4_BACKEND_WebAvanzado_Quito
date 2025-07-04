const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const newUser = await prisma.user.create({
      data: { username, password: hashed }
    });
    res.json({ id: newUser.id, username: newUser.username });
  } catch (error) {
    if (error.code === 'P2002') { // usuario duplicado
      return res.status(400).json({ error: 'Usuario ya existe' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });
  
  const match = await bcrypt.compare(password, user.password).catch(err => {
  return res.status(500).json({ error: 'Error al comparar la contraseña' });
});


  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

router.get('/profile', require('../middleware/authMiddleware'), (req, res) => {
  res.json({ message: `Hola ${req.user.username}, esta es tu info protegida.` });
});

module.exports = router;
