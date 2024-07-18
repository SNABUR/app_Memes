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
const axios = require('axios');
const { format } = require('date-fns');

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY;

app.use(cors({
    origin: ['https://goldengcoin.github.io', 'https://jettonfactory.github.io'] // Restringe los orígenes permitidos
}));

app.use(express.json());

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

const db = new Client({
    user: process.env.USER_DB_POSTGRES,
    host: process.env.HOST_DB_POSTGRES,
    database: process.env.DATABASE_DB_POSTGRES,
    password: process.env.PASSWORD_DB_POSTGRES,
    port: process.env.PORT_DB_POSTGRES,
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

// json upload comand 

app.post('/create-json', async (req, res) => {
    try {
        const jsonData = req.body;

        const pinataUrl = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
        const pinataResponse = await axios.post(pinataUrl, jsonData, {
            headers: {
                pinata_api_key: PINATA_API_KEY,
                pinata_secret_api_key: PINATA_SECRET_API_KEY
            }
        });

        if (pinataResponse.status === 200) {
            const ipfsHash = pinataResponse.data.IpfsHash;
            const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

            res.status(200).json({
                success: true,
                ipfsHash: ipfsHash,
                url: ipfsUrl
            });
        } else {
            res.status(pinataResponse.status).json({
                success: false,
                message: pinataResponse.data
            });
        }
    } catch (error) {
        console.error('Error uploading JSON to Pinata:', error);
        res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
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

app.post('/create-order', async (req, res) => {
    const { first_name, last_name, country, city, province, company, address, postal_code, email, wallet_address, item, amount } = req.body;
    // Calcula la fecha y hora actual
    const currentDate = new Date();
    // Genera un OrderCode único basado en la fecha, wallet e item
    const order_date = format(currentDate, 'yyyyMMdd-HHmmss');
    const order_code = `${order_date}-${wallet_address}-${item}`;



    db.query(
        'INSERT INTO orders (first_name, last_name, country, city, province, company, address, postal_code, email, wallet_address, item, order_date, amount, order_code) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)',
        [first_name, last_name, country, city, province, company, address, postal_code, email, wallet_address, item, order_date, amount, order_code ],
        (err, result) => {
            if (err) {
                console.log(err);
                res.status(500).json({ error: 'Error al registrar' });
            } else {
                res.send("order registered successfully");
            }
        }
    );
});

// Middleware para manejo de errores global
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(3001,()=>{
    console.log("puerto 3001 XD")
})
