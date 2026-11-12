import { useContext } from 'react';
import { SocialDataContext } from './SocialDataContext';

export const useSocialData = () => {
    const context = useContext(SocialDataContext);
    if (!context) throw new Error('useSocialData must be used within SocialDataProvider');
    return context;
};
