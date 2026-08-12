require('dotenv').config();
const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Verify DB connection before accepting requests
  await testConnection();

  app.listen(PORT, () => {
    console.log('');
    console.log('  ██████╗██╗██╗   ██╗██╗ ██████╗███████╗███████╗███╗   ██╗███████╗███████╗');
    console.log(' ██╔════╝██║██║   ██║██║██╔════╝██╔════╝██╔════╝████╗  ██║██╔════╝██╔════╝');
    console.log(' ██║     ██║██║   ██║██║██║     ███████╗█████╗  ██╔██╗ ██║███████╗█████╗  ');
    console.log(' ██║     ██║╚██╗ ██╔╝██║██║     ╚════██║██╔══╝  ██║╚██╗██║╚════██║██╔══╝  ');
    console.log(' ╚██████╗██║ ╚████╔╝ ██║╚██████╗███████║███████╗██║ ╚████║███████║███████╗');
    console.log('  ╚═════╝╚═╝  ╚═══╝  ╚═╝ ╚═════╝╚══════╝╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝');
    console.log('');
    console.log(`  🚀  API Server    : http://localhost:${PORT}`);
    console.log(`  🩺  Health Check  : http://localhost:${PORT}/api/health`);
    console.log(`  📁  Uploads       : http://localhost:${PORT}/uploads`);
    console.log(`  🌍  Environment   : ${process.env.NODE_ENV}`);
    console.log('');
  });
};

startServer().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
