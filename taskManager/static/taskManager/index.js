document.addEventListener('DOMContentLoaded', () => {
// Displaying necessary containers on click and hiding the others
    const loginView = document.querySelectorAll('#loginView');
    loginView.forEach(link =>{
        link.addEventListener('click',() =>{
        // Displaying sign in form
        document.querySelector('.logIn').style.display = 'flex';
        document.querySelector('.text-container').style.display = 'none';
        document.querySelector('.register').style.display='none';
        })  
    })

    const registerView = document.querySelectorAll('#registerView');
    registerView.forEach(link =>{
        // Displaying register form
        link.addEventListener('click',() =>{
        document.querySelector('.logIn').style.display = 'none';
        document.querySelector('.text-container').style.display = 'none';
        document.querySelector('.register').style.display='flex';
        })  
    })

    document.querySelector('#btnLogin').addEventListener('click', () => {
        logInUser(); //function call
    })

    document.querySelector('#btnRegister').addEventListener('click', () => {
        registerUser(); //function call
    })
})

function logInDisplay(){
    // This function hides other divs and only displays the logIn form's container
    document.querySelector('.logIn').style.display = 'flex';
    document.querySelector('.text-container').style.display = 'none';
    document.querySelector('.register').style.display='none';
}


function logInUser(){
    /* This function fetches the username and password values from respective containers, then makes
    a POST request to an API to log the user in. If log in is successful, alerts success message to user 
    and redirects them to workspace page. If an error occured while logging in the user,
    alerts the error message.*/
    const usernameContainer = document.querySelector('#usernameLogin');
    const passwordContainer = document.querySelector('#passwordLogin');

    const username=usernameContainer.value;
    const password = passwordContainer.value;

    fetch('/login/',{method:'POST',
    body:JSON.stringify({'username':username,'password':password}) 
    })
    .then(response => response.json())
    .then( data => {
        if(data.message){
            // redirection to another page
            window.location.href = '/workspace';
            
            console.log(data.message)
            alert(data.message)
            // Clearing the input fields
            usernameContainer.value = '';
            passwordContainer.value = '';

            localStorage.removeItem('activeOption');// clearing the local storage after sign in
        }
        else{
            console.log(data.error)
            alert(data.error)
        }
    })
    .catch(error => {
        console.log('Login error',error)
    })
}


function registerUser(){
    /* This function fetches the email,username, password and confirm password values from 
    respective containers, then makes a POST request to an API to register the user.
    If registration is successful, alerts success message to user. If an error occured 
    while registering the user,alerts the error message.*/
    const emailContainer = document.querySelector('#email');
    const usernameContainer = document.querySelector('#usernameRegister');
    const passwordContainer = document.querySelector('#passwordRegister');
    const confPasswordContainer = document.querySelector('#passwordConfirm');

    const email=emailContainer.value;
    const username=usernameContainer.value;
    const password = passwordContainer.value;
    const re_password=confPasswordContainer.value;

    fetch('/register/',{method:'POST',
    body:JSON.stringify({'email':email,'username':username,'password':password,'re-password':re_password}) 
    })
    .then(response => {console.log('Response status:', response.status);return response.json();})
    .then( data => {
        if(data.message){
            console.log(data.message);
            alert(data.message+" Please sign in to continue!")
            // Clearing the input fields
            emailContainer.value = '';
            usernameContainer.value = '';
            passwordContainer.value = '';
            confPasswordContainer.value = '';

            //function call
            logInDisplay();
        }
        else{
            console.log(data.error)
            alert(data.error)
        }
    })
    .catch(error => {
        console.log('Register error',error)
    })
}