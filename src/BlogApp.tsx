
import { BaseRouter } from './routes/BaseRouter';
import { SocialDataProvider } from './data/SocialDataProvider';
import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/styles/global.css';

export const BlogApp = () => <SocialDataProvider><BaseRouter /></SocialDataProvider>;
