BEGIN { 
    script=0;
    output=1;
    endscript=0;
    }
/<!--SCRIPT-->/ { script=1 }
/<!--ENDSCRIPT-->/ { endscript=1 }
{
    if(script) {
        print "    <script src=\"sjcl.js\"></script>";
        print "    <script src=\"main.js\"></script>";
        output=0;
        script=0;
    }
    if(output) {
        print;
    }
    if(endscript) {
        output=1;
    }
}
