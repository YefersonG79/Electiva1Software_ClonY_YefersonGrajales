import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { requireFirebase } from '../firebase/config';
import { validateTweet } from './validation';

export const publishTweet = async (value: string) => {
    const content = validateTweet(value);
    const { auth, db } = requireFirebase();
    const authorId = auth.currentUser?.uid;
    if (!authorId) throw new Error('Inicia sesión para publicar.');
    const ref = doc(collection(db, 'tweets'));
    await setDoc(ref, { id: ref.id, authorId, content, createdAt: serverTimestamp() });
};
