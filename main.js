/*
 * Api integrador contable
 */
/* This should be on top because can break the imports made before the config */
const envVars = require('dotenv');
envVars.config();
global.puerto = parseInt(process.env.puerto);

const fs = require("fs");
const zlib = require('zlib');
const express = require('express');

const app = express();

//ul base
const baseUrl = '/api/v1';
global.baseUrl = baseUrl;
global.normalizedPath = require("path").join(__dirname, "src");

app.use(express.urlencoded({ limit: '10mb', extended: true, parameterLimit: 10000000 }));
app.use(express.json({ limit: '10mb' }));

app.listen(process.env.puerto, () => {
    console.log('Servidor iniciado en el puerto ' + process.env.puerto);
});
let rutaApp = process.cwd();
var compressGzip = function (input) {
    // var input = "Geek";
    // Calling gzip method
    var buffer = zlib.gzipSync(input);
    // return buffer;
    let base64 = buffer.toString('base64');
    return base64;
};
let descompressGzip = async function (input) {
    // var input = "Geek";
    // Calling gzip method
    return zlib.gunzipSync(input.buffer).toString();

    // zlib.gunzipSync(input.content).toString();
    // return zlib.gunzipSync(input.content).toString();
    //let base64 = buffer.toString('base64');
};
let uuidv5Solo = function () {
    return 'xxxxxxxx-xxxx-xxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
app.post(baseUrl + '/save_file', async function (req, res) {
    try {
        let data = compressGzip(JSON.stringify(req.body));
        let name_file = uuidv5Solo();

        let buff = new Buffer(data, 'base64');

        fs.writeFileSync(rutaApp + '/file/' + name_file + '.pendiente', buff);
        fs.renameSync(rutaApp + '/file/' + name_file + '.pendiente', rutaApp + '/file/' + name_file + '.gzip');
        //   await saveBinaryToFile(data, rutaApp + '/file/' + name_file + '.pendiente');
        //   fs.writeSync(rutaApp + '/file/' + name_file + '.pendiente', data.toString('base64'));
        //  fs.renameSync(rutaApp + '/file/' + name_file + '.pendiente', rutaApp + '/file/' + name_file + '.json');

        res.json({ type: 1 });
    } catch (e) {
        console.log("error:" + e);
        res.status(500);
        res.json({ status: 500, error: e.message });
    }
});

let obtenerDiferencia = function (fecha) {
    //validar diferencia de segundos
    let dif = new Date().getTime() - new Date(fecha).getTime();
    let Segundos_de_T1_a_T2 = dif / 1000;
    let Segundos_entre_fechas = Math.abs(Segundos_de_T1_a_T2);
    return Segundos_entre_fechas;
};

let limpiar_archivos_viejos = async function (nombreCarpeta) {
    try {
        let files = fs.readdirSync(rutaApp + '/file/');
        for (const file of files) {
            let statsObj = fs.statSync(rutaApp + '/file/' + file);
            let fechaCreacion = new Date(statsObj.atimeMs);
            let diefrenciaSeg = obtenerDiferencia(fechaCreacion);
            // console.log("tiempo es " + diefrenciaSeg);
            if (diefrenciaSeg > parseInt(60*60*12)) {
                let fileExists = fs.existsSync(rutaApp + '/file/' + file);
                if (fileExists) {
                    fs.unlinkSync(rutaApp + '/file/'+ file);
                    console.log("archivo:eliminado:" + rutaApp + '/file/'+file);
                }
            }
        }
    } catch (err) {
        console.log(err.message);
    } finally {
    }
};

let limpiar_archivos = async function () {
    try {
        console.log('voy a limpiar_archivos ' + new Date().toLocaleString());
      await  limpiar_archivos_viejos();
        console.log('fin de limpiar_archivos ' + new Date().toLocaleString());
    } catch (error) {
        console.log(error);
    } finally {
        setTimeout(function () {
            limpiar_archivos();
        }, parseInt(process.env.tiempoMsEnvio));
    }

}
limpiar_archivos();
module.exports = app;

