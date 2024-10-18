const expressServer   = require('express');
const bodyParser= require('body-parser');




const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const cors = require('cors'); 
const appServer = expressServer();


appServer.use(cors({
    origin:'http://localhost:3000'
}));
appServer.use(bodyParser.json())
appServer.use(expressServer.urlencoded({ extended: true }));

console.log('Serving static files from:', __dirname + '/public/uploads');
appServer.use('/public/uploads', expressServer.static(__dirname + '/public/uploads'));

const swaggerOptions = {
    swaggerDefinition : {
        openapi: '3.1.0',
        info : {
            title: 'API QUIZZ',
            version : '0.0.1',
            description : 'Je suis une super API',
            contact : {
                name :'tino'
            },
            servers : [{ url: 'http://localhost:8889'}]
        }
    },
    apis : ['./routes/*.js']
}

const swaggerDocs  = swaggerJsDoc(swaggerOptions)
//initialisation du swagger
appServer.use('/api-doc', swaggerUi.serve , swaggerUi.setup(swaggerDocs))



const dbServer = require( './config/db.ts' )
dbServer.connect((err: object) => {
    if (err){
        console.log(err);
    }
    else{
        console.log('bravo !!');
    }
})


const userRoutes= require('./routes/users.ts');
appServer.use('/api/users', userRoutes);

const oeuvresRoutes= require('./routes/oeuvres.ts');
appServer.use('/api/oeuvres', oeuvresRoutes);


const artistRoutes = require('./routes/artist.ts');
appServer.use('/api/artist', artistRoutes);

const expoRoutes = require('./routes/expo.ts');
appServer.use('/api/expo', expoRoutes);


const port = process.env.PORT || 5050;
appServer.listen(port, () =>{
    console.log(`SERVER  DEMMARE: ${process.env.PORT}`)

})