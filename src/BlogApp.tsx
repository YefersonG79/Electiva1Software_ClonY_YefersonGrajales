
import { BaseRouter } from './routes/BaseRouter';
import { MockDataProvider } from './data/MockDataProvider';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/styles/global.css';

export const BlogApp = () => <MockDataProvider><BaseRouter /></MockDataProvider>;
