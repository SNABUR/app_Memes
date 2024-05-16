const express = require("express");
const app = express();
const mysql = require("mysql");
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');
const { processImage } = require('./imageProcessor');
const path = require('path'); // Importa el módulo 'path'
const { Client } = require('pg');


app.use(cors());
app.use(express.json());

const db = new Client({
  user: 'postgress',
  host: 'dpg-cp1tus021fec738htqng-a',
  database: 'db_memes',
  password: 'O0wllYwpavK3XIYhpjk7N0Om4LmMT6ao',
  port: 5432,
});

db.connect();


app.post("/create", (req, res) => {
    const { name, ticker, fee, contract, image, creator, creation, supply, webpage, twitter, description, discord, telegram } = req.body;

    db.query(
        'INSERT INTO db_memes(name, ticker, fee, contract, image, creator, creation, supply, webpage, twitter, description, discord, telegram) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
        [name, ticker, fee, contract, image, creator, creation, supply, webpage, twitter, description, discord, telegram],
        (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: 'Error al registrar' });
            } else {
                res.send("Registrado con éxito");
            }
        }
    );
    
});


app.get("/db_memes",(req,res) => {
    const nameFilter = req.query.name || ''; // Obtener el nombre del query parameter 'name'

    // Consulta SQL para obtener los memes filtrados por nombre y limitar los resultados a 3
    let sqlQuery = '';
    let sqlParams = [];
    
    if (nameFilter !== '') {
        // Si se proporciona un nombre, filtrar por ese nombre y limitar a 3
        sqlQuery = `SELECT * FROM db_memes WHERE name LIKE ? LIMIT 3`;
        // Añadir '%' al inicio y al final del nombre para realizar una búsqueda parcial
        const namePattern = '%' + nameFilter + '%';
        sqlParams = [namePattern];
    } else {
        // Si el nombre está vacío, devolver los primeros 3 memes
        sqlQuery = `SELECT * FROM db_memes ORDER BY name ASC LIMIT 10`;
    }

    db.query(sqlQuery, sqlParams, (err,result) => {
        if(err){
            console.log(err);
            res.status(500).json({ error: 'Error fetching memes' });
        } else {
            res.send(result.rows);
        }
    });
});




//////////// db pools //////////////

app.post("/create",(req,res) => {
    const token_name = req.body.token_name;
    const tvl_stk = req.body.tvl_stk;
    const apy = req.body.apy;
    const stakers = req.body.stakers;
    const stk_liq = req.body.stk_liq;
    const imageUrl = req.body.imageUrl;
    const multiplier = req.body.multiplier;
    const token = req.body.token;
    const stake_contract = req.body.stake_contract;

    db.query('INSERT INTO db_memes(token_name,tvl_stk,apy,stakers,stk_liq,imageUrl,multiplier,token,stake_contract) VALUES(?,?,?,?,?,?,?,?,?)',[token_name,tvl_stk,apy,stakers,stk_liq,imageUrl,multiplier,token,stake_contract],
    
(err,result)=>{
    if(err){
        console.log(err);
    }else{
        res.send("Regitrado con exito");
    }
}
);
});


app.get("/db_pools_memes",(req,res) => {

    db.query('SELECT * FROM db_pools_memes',

(err,result)=>{
    if(err){
        console.log(err);
    }else{
        res.send(result.rows);
    }
}
);
});


// Configuración de multer para manejar la carga de archivos


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./memes_images"); // Directorio donde se guardarán las imágenes
    },
    filename: function (req, file, cb) {
      // Generar un nombre único usando un timestamp y un UUID
      const timestamp = new Date().getTime();
      const ext = file.originalname.split('.').pop(); // Obtén la extensión del archivo
      const uniqueName = `${timestamp}-${uuidv4()}.${ext}`;
      cb(null, uniqueName);
    },
  });
  
  const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Verificar si el archivo es una imagen
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Solo se permiten archivos de imagen.'));
        }
        cb(null, true);
    },
    // Convertir todas las imágenes a formato JPEG
    // y establecer una calidad de compresión del 80%
    // antes de guardarlas en el servidor
    limits: {
        fileSize: 10 * 1024 * 1024, // Limite de tamaño de archivo: 10MB
    }
});


app.post("/api/upload",upload. single('image'), async (req, res) => {
    try {
        const uniqueName = req.file.filename;
        console.log(uniqueName,"unique name");

        // Enviar el nombre del archivo como respuesta al frontend
        res.status(200).json({ imageName:  uniqueName });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Error uploading image' });
    }
});

app.use('/memes_images', express.static(path.join(__dirname, 'memes_images')));


app.listen(3001,()=>{
    console.log("puerto 3001 XD")
})
