$(document).ready(function(){
// OUTPUT LOGS

    $("#changeTitle").click(function(){
        $("#buttonLog").text("You clicked me!")
        $(this).css("background", "yellow")
    })

    $("#changeTitle").mouseenter(function(){
        $(this).css("background", "rgb(136, 177, 177)")
        $("#buttonLog").text("Change title is hovered!")
    })

    $("#changeTitle").mouseleave(function(){
        $(this).css("background", "rgb(179, 218, 218)")
        $("#buttonLog").text("Mouse left the button!")
    })

    $("#changeTitle").dblclick(function(){
        $("#buttonLog").text("You double clicked me!")
        $("#title").text("Hi, Andrei!")
    })

// HIDE PROFILE 

    $("#hideProfile").mouseenter(function(){
        $(this).css("background", "rgb(136, 177, 177)")
        $("#buttonLog").text("Mouse hovered the hide button!")
    })

    $("#hideProfile").mouseleave(function(){
        $(this).css("background", "rgb(179, 218, 218)")
        $("#buttonLog").text("Mouse left the hide button!")
    })

    $("#hideProfile").click(function(){
        $("#card2").hide(1000)
        $("#buttonLog").text("Profile is hidden")
    })

//SHOW PROFILE 

    $("#showProfile").mouseenter(function(){
        $(this).css("background", "rgb(136, 177, 177)")
        $("#buttonLog").text("Mouse hovered the show button!")
    })

    $("#showProfile").mouseleave(function(){
        $(this).css("background", "rgb(179, 218, 218)")
        $("#buttonLog").text("Show button is not hovered anymore!")
    })

    $("#showProfile").click(function(){
        $("#card2").show(1000)
        $("#buttonLog").text("Profile is shown")
    })

// COURSE SELECTION AND PROFILE UPDATE 

    $("#course").change(function(){
        $("#courseProfile").text($(this).val())
        // $("#courseLog").text("You selected a course")
        $("#courseLog").text("You selected " + $(this).val())
    })
    
    $("#course").focus(function(){
        $("#courseLog").text("You are selecting a course")
    })


// TABLE COLOR BUTTONS
    $("#btnOdd").click(function(){
        $("tr:odd").css("background", "lightblue")
        $("tr:even").css("background", "white")
        $("#tableLog").text("Applied Odd Styling")
    })

    $("#btnEven").click(function(){
        $("tr:odd").css("background", "white")
        $("tr:even").css("background", "lightblue")
        $("#tableLog").text("Applied Even Styling")

    })

    $("#btnOdd").mouseenter(function(){
        $(this).css("background", "rgb(136, 177, 177)")
    })

    $("#btnOdd").mouseleave(function(){
        $(this).css("background", "rgb(179, 218, 218)")
    })

    $("#btnEven").mouseenter(function(){
        $(this).css("background", "rgb(136, 177, 177)")
    })

    $("#btnEven").mouseleave(function(){
        $(this).css("background", "rgb(179, 218, 218)")
    })

// TABLE HIDE & SHOW
    $("#btnHide").mouseenter(function(){
        $(this).css("background", "rgb(136, 177, 177)")
    })

    $("#btnHide").mouseleave(function(){
        $(this).css("background", "rgb(179, 218, 218)")
    })

    $("#btnHide").click(function(){
        $(".tableCard").hide(1000)
        $("#tableLog").text("Table is now hidden")

    })

    // 

    $("#btnShow").mouseenter(function(){
        $(this).css("background", "rgb(136, 177, 177)")
    })

    $("#btnShow").mouseleave(function(){
        $(this).css("background", "rgb(179, 218, 218)")
    })

    $("#btnShow").click(function(){
        $(".tableCard").show(1000)
        $("#tableLog").text("Table is now shown")

    })




})