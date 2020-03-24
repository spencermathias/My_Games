# RPi-RTDS
Raspberry pi realtime data server based on node.js express and socket.io.

To Use:
0. find out what arm version the cpu on your rasperry pi is with the command: cat /proc/cpuinfo

1. download node from nodejs.org. Go to other downloads and select the arm version that matches the info from the above step.

2. extract the downloaded file with: tar -xvf 

3. enter the extracted directory with: cd 

4. copy to usr/local with: sudo cp -R * /usr/local/

5. check if it has installed with: node -v

  it should return the version that you downloaded

5. (optional) remove the downloaded and extracted files with: rm -r

6. npm install express --save
  The warnings at the end are normal

7. npm install socket.io --save
  The warnings at the end are normal

3. Run node server.js in a command line. 

   This starts a node.js webserver with socket.io to bidirectionally send data between a raspberry pi and a web browser.

4. Go to the ip address of the raspberry pi in a webbrowser. The index.html page should appear.
