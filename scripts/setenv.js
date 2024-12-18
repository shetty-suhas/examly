const fs = require('fs');
require('dotenv').config();

// Create environments directory if it doesn't exist
const dir = './src/environments';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// Development environment file
const environmentFile = `export const environment = {
    production: false,
    firebase: {
        apiKey: '${process.env.FIREBASE_API_KEY}',
        authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
        projectId: '${process.env.FIREBASE_PROJECT_ID}',
        storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
        messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
        appId: '${process.env.FIREBASE_APP_ID}'
    }
};
`;

// Production environment file
const productionEnvironmentFile = `export const environment = {
    production: true,
    firebase: {
        apiKey: '${process.env.FIREBASE_API_KEY}',
        authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
        projectId: '${process.env.FIREBASE_PROJECT_ID}',
        storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
        messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
        appId: '${process.env.FIREBASE_APP_ID}'
    }
};
`;

// Write the files
fs.writeFileSync('./src/environments/environment.ts', environmentFile);
fs.writeFileSync('./src/environments/environment.prod.ts', productionEnvironmentFile);

console.log('Environment files generated successfully!');