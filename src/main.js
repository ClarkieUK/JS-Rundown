
function convert(number)
{
    return String(number)
};

function main()
{
    
    let text = "";

    for (let i = 0; i < 3; i++)
    {
        for (let j = 0; j < 3; j++)
        {
            text += j +"<br>";
        };
    };

    document.writeln((text));

    
    
    document.getElementById('test').innerText = 'Hello There!';

};

main();