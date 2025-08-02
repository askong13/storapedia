// =====================================================================
// AUTHENTICATION LOGIC
// =====================================================================
function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .catch(err => Swal.fire('Login Failed', err.message, 'error'));
}

function handleAdminLogout() {
    auth.signOut();
}

function sendPasswordReset(email) {
    auth.sendPasswordResetEmail(email)
        .then(() => Swal.fire('Success', `Password reset email sent to ${email}.`, 'success'))
        .catch(err => Swal.fire('Error', err.message, 'error'));
}