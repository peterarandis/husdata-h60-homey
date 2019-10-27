module.exports = {
  INDOOR_TEMP     : 'measure_temperature',
  OUTDOOR_TEMP    : 'measure_temperature.outdoor',
  TARGET_TEMP     : 'target_temperature',
  PRESSURE        : 'system_pressure',
  CLOCK_PROGRAMME : 'clock_programme',
  OPERATING_MODE  : 'operating_mode',
  THERMOSTAT_MODE : 'thermostat_mode',
  CENTRAL_HEATING : 'central_heating',
  ALARM_PRESSURE  : 'alarm_pressure',
}
/*
		  v[0] = result.X0001;  cap[0] = 'cap_0001' ; // Radiator return temp 
		  v[1] = result.X0002;  cap[1] = 'cap_0002' ; // Radiator forward temp
		  v[2] = result.X0005;  cap[2] = 'cap_0005' ; // Brine In
		  v[3] = result.X0006;  cap[3] = 'cap_0006' ; // Brine Out
		  v[4] = result.X0007;  cap[4] = 'cap_0007' ; // Outdoor temp
		  v[5] = result.X0009;  cap[5] = 'cap_0009' ; // Warm water temp
		  v[6] = result.X3104;  cap[6] = 'cap_3104' ; // Add heat status %
		  v[7] = result.X1A04;  cap[7] = 'cap_1A04' ; // Compressor status
		  v[8] = result.X1A07;  cap[8] = 'cap_1A07' ; // Switch valve status
		  v[9] = result.X1A20;  cap[9] = 'cap_1A20' ; // Sum alarm
		 v[10] = result.X0203; cap[10] = 'cap_0203' ; // Indoor temp setting	  
		 
*/