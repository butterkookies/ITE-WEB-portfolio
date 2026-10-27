const var1 = document.getElementById("submit")
const var2 = document.getElementById("double")
const var3 = document.getElementById("press-hold")
const var4 = document.getElementById("username")
const var5 = document.getElementById("password")
const var6 = document.getElementById("output")
const var7 = document.getElementById("student-name")

var1.addEventListener(
    "click", function(){
        var6.innerHTML = "Submitted";
    }
);

var2.addEventListener(
    "focus", function(){
        var4.style.backgroundColor = "red"
    }
);

var3.addEventListener(
    "mousedown", function(){
        var5.style.backgroundColor = "red"
        var5.style.borderStyle = "dashed"
    }
);

var3.addEventListener(
    "mouseup", function(){
        var5.style.backgroundColor = "yellow"
        var5.style.borderColor = "green"
    }
);

var4.addEventListener(
    "input", function(){
        var7.textContent = "Hello, " + var4.value; 
    }
)

