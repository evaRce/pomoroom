import React, { useState, useEffect, useRef } from "react";
import { Button, InputNumber, Modal, Form } from "antd";
import {
  CaretRightOutlined,
  PauseOutlined,
  UndoOutlined,
  SettingOutlined,
} from "@ant-design/icons";

export default function PomodoroCountdown() {
  const [workSeconds, setWorkSeconds] = useState(25 * 60);
  const [breakSeconds, setBreakSeconds] = useState(5 * 60);
  const [longBreakSeconds, setLongBreakSeconds] = useState(15 * 60);
  const [time, setTime] = useState(workSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isWorkTime, setIsWorkTime] = useState(true);
  const [isFinish, setIsFinish] = useState(false);
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);
  const [form] = Form.useForm();
  const timerRef = useRef(null);
  const audioWork = useRef(new Audio("/sounds/bell-notification.wav"));
  const audioRest = useRef(new Audio("/sounds/happy-bells-notification.wav"));

  const startTimer = () => {
    if (!isRunning) {
      setIsRunning(true);
      timerRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 0) {
            setIsFinish(true);
            clearInterval(timerRef.current);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      if (isWorkTime) {
        setPomodoroCount((prevCount) => prevCount + 1);
      }
    }
  };

  useEffect(() => {
    if (isFinish) {
      if (isWorkTime) {
        console.log("PomodoroCount: ", pomodoroCount);
        audioRest.current.play();
      } else {
        audioWork.current.play();
      }

      // Cada 4 ciclos de trabajo, es un descanso largo.
      const isLongBreak = pomodoroCount > 0 && pomodoroCount % 4 === 0;

      if (isWorkTime) {
        if (isLongBreak) {
          setTime(longBreakSeconds);
        } else {
          setTime(breakSeconds);
        }
      } else {
        setTime(workSeconds);
      }

      setIsWorkTime((prevIsWorkTime) => !prevIsWorkTime);
      setIsRunning(false);
      setIsFinish(false);
    }
  }, [isFinish, isWorkTime, breakSeconds, workSeconds, longBreakSeconds]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setIsRunning(false);
    }
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTime(workSeconds);
    setIsRunning(false);
    setIsWorkTime(true);
    setIsFinish(false);
    setPomodoroCount(0);
  };

  const formatTime = () => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  const openConfigModal = () => {
    setIsConfigModalVisible(true);
    form.setFieldsValue({
      workTime: workSeconds / 60,
      shortBreakTime: breakSeconds / 60,
      longBreakTime: longBreakSeconds / 60,
    });
  };

  const handleConfigSubmit = (values) => {
    const { workTime, shortBreakTime, longBreakTime } = values;

    if (shortBreakTime >= longBreakTime) {
      alert(
        "El tiempo de `descanso corto` debe ser menor que el tiempo de `descanso largo`."
      );
      return;
    }

    setWorkSeconds(workTime * 60);
    setBreakSeconds(shortBreakTime * 60);
    setLongBreakSeconds(longBreakTime * 60);
    setTime(workTime * 60);
    setIsConfigModalVisible(false);
  };

  const handleCancelConfig = () => {
    setIsConfigModalVisible(false);
  };

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  return (
    <div className="flex flex-col lg:w-[15vw] w-auto mt-4 items-center justify-center rounded-lg space-y-4">
      <span className="text-xl font-mono">
        {isWorkTime ? "Trabajo" : "Descanso"}
      </span>
      <div className="text-5xl font-mono">{formatTime()}</div>
      <div className="flex space-x-3">
        <Button
          onClick={startTimer}
          disabled={isRunning}
          icon={<CaretRightOutlined />}
          title="Empezar"
        />
        <Button
          onClick={stopTimer}
          disabled={!isRunning}
          icon={<PauseOutlined />}
          title="Parar"
        />
        <Button onClick={resetTimer} icon={<UndoOutlined />} title="Resetear" />
        <Button
          onClick={openConfigModal}
          icon={<SettingOutlined />}
          title="Configurar"
        />
      </div>

      <Modal
        width={300}
        title="Configurar tiempos"
        open={isConfigModalVisible}
        onCancel={handleCancelConfig}
        footer={[
          <Button key="cancel" onClick={handleCancelConfig}>
            Cancelar
          </Button>,
          <Button
            key="ok"
            className="bg-sky-400/80"
            onClick={() => form.submit()}
          >
            Aceptar
          </Button>,
        ]}
        centered
        className="font-mono"
      >
        <Form
          className="m-0"
          form={form}
          onFinish={handleConfigSubmit}
          layout="vertical"
        >
          <Form.Item
            label="Tiempo de trabajo (minutos)"
            name="workTime"
            rules={[
              {
                required: true,
                message: "Ingresa un tiempo de trabajo.",
              },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Descanso corto (minutos)"
            name="shortBreakTime"
            rules={[
              {
                required: true,
                message: "Ingresa un tiempo de descanso corto.",
              },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            label="Descanso largo (minutos)"
            name="longBreakTime"
            rules={[
              {
                required: true,
                message: "Ingresa un tiempo de descanso largo.",
              },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
