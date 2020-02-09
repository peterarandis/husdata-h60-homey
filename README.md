# Husdata

App for the Husdata H60 heat pump gateway.

The Husdata.se product H60 is a WiFi gateway that fits many Groundsource and Liquid/Air heat pumps. It support heat pumps from IVT, Bosch, Nefit, Carrier, NIBE, Thermia and others giving a very flexible gateway towards home automation.
Besides the Athom Homey support, the H60 gateway has a built in web portal supports protocols: MQTT, Modbus TCP and Web API/Json.

Including features:

- Easy setup with discovery and pairing of connected H60
- Display heat pump system temperatures, status and operating modes
- Adjust heating settings
- Build flows using triggers for temperatures and statuses

Flows using heat pump data can be very usable
For example, Trig notifications if...
- Heat pump gets into alarm state
- Electrical Additional heater has started or going over 50% power level.
- Outdoor or Indoor temperature goes over/under a treshold
- Delta between Brine IN and OUT is to high
- Warm water temp is going too low (over used, long shower)

 
This application is generic for all heatpumps so some displayed sensors/status may output "-" if not valid for your particular model. App supports English, Dutch and Swedish .
 
Husdata.se
Peter Hansson
info@husdata.se

