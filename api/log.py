from sys import stderr as standard_error
from datetime import datetime

def stderr(*output):
    output = ' '.join(map(str, output))
    print(datetime.now().strftime("[%d-%b-%y %I:%M:%S %p]"), output, file=standard_error)

def file(*output, file='/log/file.log'):
    output = ' '.join(map(str, output))
    with open(file, 'a') as logfile:
        print(datetime.now().strftime("[%d-%b-%y %I:%M:%S %p]"), output, file=logfile)
