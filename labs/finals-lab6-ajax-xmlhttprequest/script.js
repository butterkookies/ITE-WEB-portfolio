const button = document.getElementById("loadBtn")
const result= document.getElementById("result")

button.addEventListener("click", function(){

    let request = new XMLHttpRequest()

    request.open("GET", "students.txt", true)

    request.onload = function(){
        result.innerHTML = request.response
    }

    request.send()
})