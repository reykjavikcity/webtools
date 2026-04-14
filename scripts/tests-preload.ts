import { GlobalRegistrator } from '@happy-dom/global-registrator';

// Set up happy-dom
const oldConsole = console;
GlobalRegistrator.register();
window.console = oldConsole;
