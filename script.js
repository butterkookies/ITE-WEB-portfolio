const button = document.getElementById('submit');
const message = document.getElementById('js');
const colorInput = document.getElementById('color');

// Function para magpalit ng mensahe at kulay
function showMessage(text, color) {
    message.innerHTML = text;
    message.style.backgroundColor = color;
}

// Diretso ipapasa ang colorInput.value pag-click (walang conditional)
button.addEventListener('click', function() {
    showMessage("Color updated!", colorInput.value);
});

// Hover effects sa button
button.addEventListener('mouseover', function() {
    button.style.backgroundColor = 'blue';
    button.style.borderRadius = '5px';
});

button.addEventListener('mouseout', function() {
    button.style.backgroundColor = 'green';
    button.style.borderRadius = '20px';
});