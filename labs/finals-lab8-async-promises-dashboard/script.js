const message = document.getElementById("message")
const Button1 = document.getElementById("leftBtn")
const Button2 = document.getElementById("rightBtn")

const Profile = document.getElementById("profile")
const Images = document.getElementById("images")
const Reels = document.getElementById("reels")

const var1 = document.getElementById("profile")
const var2 = document.getElementById("grades")
const var3 = document.getElementById("schedule")


Button2.addEventListener("click", function(){
    Button1.style.backgroundColor = "black"
    Button2.style.backgroundColor = "indigo"
    var1.innerHTML = "Profile: Waiting..."
    var2.innerHTML = "Grades: Waiting..."
    var3.innerHTML = "Schedule: Waiting..."
    var1.style.color = "green"
    var2.style.color = "green"
    var3.style.color = "green"

    const loadingPromise = new Promise(function(resolve){
        setTimeout(function(){
            message.style.color = "red"
            message.innerHTML = "Loading Images..."
            var1.innerHTML = "Profile: Loaded"

            resolve();

        },1000)

    })

    const assetsPromise = new Promise(function(resolve){
        setTimeout(function(){
            message.style.color = "green"
            message.innerHTML = "Loading Assets..."
            var2.innerHTML = "Grades: Loaded"

            resolve();

        },2000)

    })

    const reelsPromise = new Promise(function(resolve){
        setTimeout(function(){
            message.style.color = "orange"
            message.innerHTML = "Loading Reels..."
            var3.innerHTML = "Schedule: Loaded"

            resolve();

        },3000)

    });

    Promise.all([loadingPromise, assetsPromise, reelsPromise])

    .then(function(){
        message.innerHTML = "Dashboard ready!"

    });
})


Button1.addEventListener("click", function(){
    message.style.color = "pink"
    message.innerHTML = "Loading..."

    const loadingPromise = new Promise(function(resolve){
        setTimeout(function(){
            message.style.color = "red"
            message.innerHTML = "Loading Images..."

            resolve();

        },1000)

    })

    const assetsPromise = new Promise(function(resolve){
        setTimeout(function(){
            message.style.color = "green"
            message.innerHTML = "Loading Assets..."

            resolve();

        },2000)

    })

    const reelsPromise = new Promise(function(resolve){
        setTimeout(function(){
            message.style.color = "orange"
            message.innerHTML = "Loading Reels..."

            resolve();

        },3000)

    });

    Promise.all([loadingPromise, assetsPromise, reelsPromise])

    .then(function(){
        message.innerHTML = "Dashboard ready!"

    });
})