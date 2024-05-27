require("dotenv").config();
const express = require("express");
const app = express();
const multer = require("multer");
const cors = require("cors");
const { v4: uuidv4 } = require('uuid');
const { processImage } = require('./imageProcessor');
const path = require('path'); // Importa el módulo 'path'
const { Client } = require('pg');
const ImageKit = require("imagekit");


app.use(cors({
    origin: 'https://goldengcoin.github.io', // Restringe los orígenes permitidos
}));

app.use(express.json());

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const db = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'db_memes',
    password: '1M3M323_3-152G0553XD##',
    port: 5432,
});

db.connect();

const generateUniqueFilename = (originalName) => {
    const timestamp = new Date().getTime();
    const ext = path.extname(originalName); // Obtiene la extensión del archivo
    const uniqueName = `${timestamp}-${uuidv4()}${ext}`;
    return uniqueName;
};

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
        sqlQuery = `SELECT * FROM db_memes WHERE name LIKE $1 LIMIT 3`;
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




app.get("/db_pools_memes",(req,res) => {

    db.query('SELECT * FROM db_pools_memes', (err,result)=>{

        if(err){
            console.log(err);
        }else{
            res.send(result.rows);
        }
    }
);
});


// Configuración de multer para manejar la carga de archivos

  
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Solo se permiten archivos de imagen.'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 2 * 1024 * 1024,
    }
});

app.post("/api/upload", upload.single('image'), (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generar un nombre de archivo único
        const uniqueFilename = generateUniqueFilename(file.originalname);

        imagekit.upload({
            file: file.buffer,
            fileName: uniqueFilename,
        }, function (error, result) {
            if (error) {
                console.error('Error uploading to ImageKit:', error);
                return res.status(500).json({ error: 'Error uploading image' });
            }   

            // Imprimir el nombre del archivo en la consola
            console.log('Uploaded file name:', result.url);

            // Enviar la URL y el nombre del archivo en la respuesta
            res.status(200).json({
                imageUrl: result.url,
                fileName: result.name,
                fileId: result.fileId
            });
        });

    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Error uploading image' });
    }
});

// Middleware para manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(3001,()=>{
    console.log("puerto 3001 XD")
})
