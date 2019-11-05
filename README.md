# Husdata

Athom Homey app for Husdata H60 heat pump gateway.

Husdata.se product H60 is a WiFi gateway that fits many Groundsource and Liquid/Air heatpumps.
It support heat pumps from as IVT, Bosch, Nefit, Carrier, NIBE, Thermia and others giving a very flexible gateway towards home automation.
The gateway has built in web portal and are supporting the protocols: MQTT, Modbus TCP and Web API/Json.


This app gives you the following functions using H60.

* Easy setup with discovery and pairing of connected H60
* Display system temperatures, status and operating mode
* Adjust heat settings
* Build flows using triggers for temperatures and statuses

Flows based on heat pump data can be very usable
For example, Trig notifications if...
* Heat pump gets an alarm on display
* Electrical Additional heater has started or going over 50% power level.
* Outdoor or Indoor temperature goes over/under a treshold
* Delta between Brine IN and OUT is to high (should be 3-4 C)
* Warm water temp is going too low (over used, long shower)

 
 This application is generic for all heatpumps so some displayed sensors/status may output "-" if not valid for your particular model.
 
 Husdata.se
 Peter Hansson
 info@husdata.se
