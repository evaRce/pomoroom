import React, { useEffect, useState } from "react";
import { Button, Form, Input, Statistic} from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { HomeOutlined } from '@ant-design/icons';

export interface LoginProps {
  searchUser(email: string, password: string): any;
  errors: object;
}

export const Login: React.FC<LoginProps> = (props: LoginProps) => {
  const { searchUser, errors } = props;
  const [form] = Form.useForm();
  const [imageNumber, setImageNumber] = useState(1);

  const onFinish = (newValues: any) => {
    searchUser(newValues.email, newValues.password);
  };

  useEffect(() => {
    if (errors) {
      const commonError = errors["email"] || errors["password"];
      if (commonError) {
        form.setFields([
          { name: "email", errors: [commonError] },
          { name: "password", errors: [commonError] },
        ]);
      }
    }
  }, [errors, form]);

  useEffect(() => {
    const randomImageNumber = Math.floor(Math.random() * 5) + 1;
    setImageNumber(randomImageNumber);
  }, []);

  return (
    <div
      className="relative min-h-dvh flex flex-col items-center justify-center overflow-y-auto p-4 sm:p-8"
      style={{
        backgroundImage: `url(/images/background2/background-${imageNumber}.svg)`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundColor: "rgba(255, 255, 255, 0.5)",
        backgroundBlendMode: "overlay",
      }}
    >
      <a href="/">
        <Button
          className="absolute top-4 left-4 sm:top-8 sm:left-8 shadow bg-white"
          icon={<HomeOutlined />}
          size="large"
          title="Página de inicio"
        />
      </a>
      <div className="max-w-md md:max-w-lg lg:max-w-xl w-full my-4">
        <div className="p-4 sm:p-8 rounded-2xl bg-white shadow">
          <p className="text-center text-lg lg:text-xl sm:text-2xl font-bold mb-6">
            <span className="text-purple-600">Pomo</span><span className="text-black">room</span>
          </p>
          <p className="text-gray-800 text-center text-2xl md:text-2xl lg:text-3xl font-bold">
            ¡Nos alegra verte otra vez!
          </p>
          <p className="text-gray-800 text-center text-sm md:text-lg lg:text-xl font-bold -mt-1">
            Ingresa tus datos para comenzar.
          </p>
          <Form
              form={form}
              layout="vertical"
              name="normal_login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              className="mt-5 space-y-4"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "¡Por favor ingrese su correo electrónico!",
                  },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="site-form-item-icon" />}
                  placeholder=""
                />
              </Form.Item>
              <Form.Item
                label="Contraseña"
                name="password"
                rules={[
                  {
                    required: true,
                    message: "¡Por favor ingrese su contraseña!",
                  },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="site-form-item-icon" />}
                />
              </Form.Item>
              <Form.Item>
                <a
                  className="text-blue-600 underline font-semibold"
                >
                  Olvidaste tu contraseña?
                </a>
              </Form.Item>
              <Form.Item>
                <Button
                  htmlType="submit"
                  className="!h-11 !border-2 text-white text-base font-semibold transitiona-all duration-700 bg-purple-500 !border-purple-500 hover:!bg-purple-400 hover:!border-purple-300 hover:!text-white focus:!bg-purple-400 focus:!border-purple-300 focus:!text-white active:!bg-purple-400 active:!border-purple-300 active:!text-white"
                  block
                >
                  Iniciar sesión
                </Button>
                <p className="text-gray-800 text-sm !mt-5 mb-0 text-center">
                  ¿No tienes una cuenta?
                  <a
                    href="signup"
                    className="text-blue-600 underline ml-1 whitespace-nowrap font-semibold"
                  >
                    Registrate aquí
                  </a>
                </p>
              </Form.Item>
            </Form>
        </div>
      </div>
    </div>
  );
  
};
