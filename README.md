# Husdata

App for the Husdata H60 & H66 heat pump gateways.

The Husdata.se WiFi gateway fits many Groundsource and Liquid/Air heat pumps. It support heat pumps from IVT, Bosch, Nefit, Carrier, NIBE, Thermia and other brands.
Besides the Athom Homey support, the H60 gateway has a built in web interface and supports protocols MQTT, Modbus TCP, Webhooks and Web API/Json giving a very flexible gateway towards home automation.

Including features:

- Easy setup with discovery and pairing
- Display heat pump system temperatures, status and operating modes
- Adjust indoor temp setting
- Build flows using triggers for temperatures and statuses
- Logging of heatpump sensors and operations to Insights graphing for analysis

Flows using heat pump data can be very usable
For example, Trig notifications if...
- Heat pump gets into alarm state
- Electrical Additional heater has started or going over 50% power level.
- Outdoor or Indoor temperature goes over/under a treshold
- Delta between Brine IN and OUT is to high
- Warm water temp is going too low (over-used, long shower)


This application is generic for all heatpumps so some sensors/status may output "-" if not valid for your particular model. App supports English, Dutch and Swedish .

Husdata.se
Peter Hansson
info@husdata.se

