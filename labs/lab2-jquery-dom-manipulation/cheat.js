const Var1 = document.getElementById("letter")

$(document).ready(function(){

    // $("*"),css("font-family", "Verdana")

    $("#title").text("Welcome to Mobile Legends")

    $("p").css("color", "pink")

    $(".intro").text("Hatdfog")

    $("#btn").mouseleave(function(){
        $(this).css("background", "blue")
        $(this).css("color", "white")
        $("p.intro").css("font-family", "Segoe UI")
        $("[href]").css("color", "white")
        $("#message").text("Your mouse left the button!")
    })

    $("#btn").mouseenter(function(){
        $(this).css("background", "red")
        $(this).css("color", "white")
        $("p.intro").css("font-family", "Times New Roman")
        $("ul li:first").css("color", "green")
        $("ul li:last").css("color", "white")
        $("[href]").css("color", "black")
        $("th").css("background", "gold")
        $("tr:even").css("background", "lightblue")
        $("tr:odd").css("background", "lightgreen")
        $("#message").text("Your mouse reached the button!")

    })

    $("#btn2").mousedown(function(){
        $(this).css("background", "red")
    })
    
    $("#name").blur(function(){
        $("#message").text("Output:")
    })

    $("#name").focus(function(){
        $("#message").text("typing....")
    })
    
    $("#course").change(function(){
        $("#message").text($(this).val())
    })

    $("#btnHide").click(function(){
        $("#table").hide(3000)
    })

    $("#btnShow").click(function(){
        $("#table").show(5000)
    })

})