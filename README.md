Proyecto Modulo 5 - EthKipu
coffeeSwap es una aplicación descentralizada (dApp) que permite a los usuarios ganar recompensas por hacer staking

Url del contrato Token Farm
https://sepolia.etherscan.io/address/0x5dADBe91cca895f25836748efF93fa4BffFeaf35

Url del contrato LPToken
https://sepolia.etherscan.io/address/0xeAC3b0670509e58c88b6Dc2EB452007861FFA126

Url del contrato DAppToken
https://sepolia.etherscan.io/address/0x5D9A986BD68406CCd50627067d073E900BEFBd61

Instalacion
Instala las dependencias del proyecto en cada carpeta

npm install

# o si usas yarn

yarn install
Ejecucion del proyecto
Front en vercel : https://coffee-swap-two.vercel.app/

Modo desarrollo en local front
npm run dev

# o si usas yarn

yarn dev
Variables de entorno
para poder ejecutar el deployment del contrato copia las variables en el .env.example y colors en tu archivo .env y ejecuta

npx hh compile
npx hh ignition deploy ignition/modules/deploy.ts --network sepolia --verify
Script del contrato

Authors
@jatapsilver
