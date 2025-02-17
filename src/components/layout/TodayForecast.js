// components
import Button from "../ui/Button";
import CircleButton from "../ui/CircleButton";
import Spinner from "../ui/Spinner";
// lib
import { useContext, useState } from "react";
import styled from "styled-components";
// helpers
import { COLORS } from "../../theme/colors";
import { SIZES } from "../../theme/spacing";
import { LocationContext } from "../../context/locationContext";
import useImage from "../../utils/useImage";
import useString from "../../utils/useString";
import { WeatherContext } from "../../context/weatherContext";
import { formatDate } from "../../utils/date";
import { getGPS, getWeather } from "../../utils/api";
import { WEATHER } from "../../utils/weather";
import { UiContext } from "../../context/uiContext";
import { convertToF } from "../../utils/tempConvert";
// assets
import IconGPS from "../../images/icon_gps.svg";
import IconLocation from "../../images/icon_location.svg";
import CloudsBackground from "../../images/Cloud-background.png";

export default function TodayForecast({ onSearch }) {
  const [isLoading, setIsLoading] = useState(false);
  const locationCtx = useContext(LocationContext);
  const weatherCtx = useContext(WeatherContext);
  const uiCtx = useContext(UiContext);
  const t = useString();

  const weatherImg = !!weatherCtx.state[0].weather
    ? WEATHER[weatherCtx.state[0].weather].image
    : "weather_clear.png";
  const { image } = useImage(weatherImg);
  const currentDate = formatDate(navigator.language);
  const isCelsius = uiCtx.state.isCelsius;
  const units = isCelsius ? "C" : "F";

  const handleGetGPSLocation = async () => {
    setIsLoading(true);
    try {
      const gps = await getGPS();
      const lattlong = gps[0].latt_long.split(",");

      const payload = {
        lat: lattlong[0],
        long: lattlong[1],
        name: gps[0].title,
        woeid: gps[0].woeid,
      };

      await locationCtx.dispatch({
        type: "update",
        payload,
      });
      const newData = await getWeather(payload);
      await weatherCtx.dispatch({ type: "update", payload: newData });
    } catch {
      alert(
        "To get a forecast for your location, you must enable Location services."
      );
    }
    await uiCtx.dispatch({ type: "disableOnboarding" });

    setIsLoading(false);
  };

  return (
    <Wrapper isOnboarding={uiCtx.state.onboarding}>
      <SearchButtons isOnboarding={uiCtx.state.onboarding}>
        <Button variant="secondary" onClick={onSearch}>
          {t("todayForecast.button")}
        </Button>
        <CircleButton
          variant="secondary"
          rounded={true}
          onClick={handleGetGPSLocation}
        >
          <img src={IconGPS} alt="current GPS location icon" />
        </CircleButton>
      </SearchButtons>
      {uiCtx.state.onboarding ? (
        <OnboardingText>{t("todayForecast.welcome")}</OnboardingText>
      ) : (
        <>
          <WeatherImage>
            <img
              className="background"
              src={CloudsBackground}
              alt="clouds background"
            />
            <img className="weather" src={image} alt="weather" />
          </WeatherImage>
          <WeatherTemp>
            <h1>
              {isCelsius
                ? weatherCtx.state[0].temp.avg
                : convertToF(weatherCtx.state[0].temp.avg)}
              <span>º{units}</span>
            </h1>
            <h2>{t(`weather.${weatherCtx.state[0].weather}`)}</h2>
          </WeatherTemp>
          <DateTimePlace>
            <Date>
              <p>{t("todayForecast.today")}</p>
              <p className="date">{currentDate}</p>
            </Date>
            <Location>
              <img src={IconLocation} alt="location icon" />
              <p>
                {locationCtx.state?.name
                  ? locationCtx.state.name
                  : "Unknown location"}
              </p>
            </Location>
          </DateTimePlace>
        </>
      )}
      {isLoading && <Spinner />}
    </Wrapper>
  );
}

const Wrapper = styled.div`
  height: 100%;
  width: ${SIZES.layout.side.width};
  background: ${COLORS.bkg.ui};
  padding: ${SIZES.inc_2};
  position: absolute;
  top: 0;
  left: 0;
  padding-bottom: ${SIZES.inc_4};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: ${(props) =>
    props.isOnboarding ? "start" : "space-between"};
  overflow: hidden;

  @media screen and (max-width: ${SIZES.breakpoint.mobile}) {
    width: 100%;
    position: static;
    min-height: 100vh;
    padding: ${SIZES.default};
  }
`;

const SearchButtons = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;

  > * {
    box-shadow: ${(props) =>
      props.isOnboarding
        ? `0 0 0 3px ${COLORS.bkg.ui}, 0 0 0 5px ${COLORS.accent.primary}`
        : "none"};
  }
`;

const WeatherImage = styled.div`
  width: 100%;
  height: 30%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  img.background {
    opacity: 0.1;
    pointer-events: none;
    position: absolute;
    top: 0;
    left: calc(${SIZES.inc_2} - 50%);
    @media screen and (max-width: ${SIZES.breakpoint.mobile}) {
      top: 50%;
      left: 50%;
      transform: translateY(-50%) translateX(-50%);
      width: 100%;
      height: auto;
    }
  }
  img.weather {
    width: 200px;
    height: 200px;

    @media screen and (max-width: ${SIZES.breakpoint.mobile}) {
      width: 150px;
      height: 150px;
    }
  }
`;

const WeatherTemp = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${SIZES.inc_4};
  margin: ${SIZES.inc_3} 0;

  h1 {
    font-size: calc(${SIZES.inc_4} * 2.5);
    font-weight: 400;

    span {
      font-size: ${SIZES.inc_4};
      color: ${COLORS.text.secondary};
    }

    @media screen and (max-width: ${SIZES.breakpoint.mobile}) {
      font-size: ${SIZES.inc_4};
      span {
        font-size: ${SIZES.inc_2};
      }
    }
  }

  h2 {
    font-size: ${SIZES.inc_3};
    font-weight: 600;
    color: ${COLORS.text.secondary};
  }
  @media screen and (max-width: ${SIZES.breakpoint.mobile}) {
    gap: ${SIZES.inc_2};
    margin: ${SIZES.inc_1_25} 0;
  }
`;

const DateTimePlace = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${SIZES.inc_2};
  font-size: ${SIZES.inc_1_5};
  color: ${COLORS.text.secondary};
  width: 100%;
  margin: ${SIZES.inc_3} 0;
  @media screen and (max-width: ${SIZES.breakpoint.mobile}) {
    margin: ${SIZES.inc_1_25} 0;
  }
`;

const Date = styled.div`
  display: flex;

  p.date:before {
    content: "•";
    display: inline;
    margin: ${SIZES.inc_1_5};
  }
`;

const Location = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: ${SIZES.dec_0_5};
`;

const OnboardingText = styled.h1`
  text-align: center;
  margin-top: ${SIZES.inc_4};
  font-size: ${SIZES.inc_1_5};

  strong {
    color: ${COLORS.accent.primary};
  }
`;
