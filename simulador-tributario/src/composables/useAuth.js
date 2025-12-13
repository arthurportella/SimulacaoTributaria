import { ref } from 'vue';
import { auth, db } from '../firebase/config';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const user = ref(null);
const authError = ref(null);

onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
});

export function useAuth() {
    
    const signup = async (email, password, userData) => {
        authError.value = null;
        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            if (!res) throw new Error('Erro ao criar usuário.');

            await updateProfile(res.user, { displayName: userData.name });

            await setDoc(doc(db, 'users', res.user.uid), {
                name: userData.name,
                phone: userData.phone,
                city: userData.city,
                state: userData.state,
                email: email,
                createdAt: Date.now()
            });

            user.value = res.user;
            return res;
        } catch (err) {
            console.error(err);
            authError.value = convertFirebaseError(err.code);
        }
    };

    const login = async (email, password) => {
        authError.value = null;
        try {
            const res = await signInWithEmailAndPassword(auth, email, password);
            user.value = res.user;
            return res;
        } catch (err) {
            console.error(err);
            authError.value = convertFirebaseError(err.code);
        }
    };

    const loginWithGoogle = async () => {
        authError.value = null;
        try {
            const provider = new GoogleAuthProvider();
            const res = await signInWithPopup(auth, provider);
            
            if (res.user) {
                const userDocRef = doc(db, 'users', res.user.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (!userDocSnap.exists()) {
                    await setDoc(userDocRef, {
                        name: res.user.displayName,
                        email: res.user.email,
                        photoURL: res.user.photoURL,
                        createdAt: Date.now(),
                        method: 'google'
                    });
                }
                user.value = res.user;
            }
            return res;
        } catch (err) {
            console.error(err);
            authError.value = convertFirebaseError(err.code);
        }
    };

    const logout = async () => {
        authError.value = null;
        await signOut(auth);
        user.value = null;
    };

    const convertFirebaseError = (code) => {
        switch (code) {
            case 'auth/email-already-in-use': return 'Este e-mail já está cadastrado.';
            case 'auth/invalid-email': return 'E-mail inválido.';
            case 'auth/weak-password': return 'A senha deve ter pelo menos 6 caracteres.';
            case 'auth/user-not-found': return 'Usuário não encontrado.';
            case 'auth/wrong-password': return 'Senha incorreta.';
            case 'auth/popup-closed-by-user': return 'Login cancelado.';
            default: return 'Ocorreu um erro. Tente novamente.';
        }
    };

    return { user, authError, signup, login, loginWithGoogle, logout };
}