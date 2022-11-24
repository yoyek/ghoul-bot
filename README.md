# Ghoul bot

1. Copy .env.sample file to .env
2. Edit twitter secrets in .env file
3. Make sure ./txlog folder is writable
4. Run developement server
```
yarn global add nodemon
yarn global add roarr-cli
yarn dev
```
5. Run production server
```
yarn start
```

There's two server routes:
- /webhook for Sentinel notifications
- /txevent for debugging saved transactions
