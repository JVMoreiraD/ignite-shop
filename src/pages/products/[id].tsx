import { GetStaticPaths, GetStaticProps } from "next"
import Image from "next/image"
import { useRouter } from "next/router"
import Stripe from "stripe"
import axios from "axios"
import { stripe } from "../../lib/stripe"
import { ImageContainer, ProductContainer, ProductsDetailsContainer } from "../../styles/pages/products"
import { useState } from "react"
import Head from "next/head"

interface IProductProps {
  product: {
    id: string;
    name: string,
    imageUrl: string,
    description: string,
    price: string
    defaultPriceId: string
  }
}

export default function Product({ product }: IProductProps) {
  const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false)

  async function handleBuyProduct() {
    try {
      setIsCreatingCheckoutSession(true)
      const response = await axios.post('/api/checkout', {
        priceId: product.defaultPriceId
      })
      const { checkoutUrl } = response.data
      console.log(response)
      window.location.href = checkoutUrl
    } catch (err) {
      setIsCreatingCheckoutSession(false)
      alert('Falha ao redirecionar para o checkout')
    }
  }

  const { isFallback } = useRouter()
  if (isFallback) {
    return <p>Loading..</p>
  }

  return (
    <>
      <Head>
        <title>{product.name} | Ignite Shop</title>
      </Head>
      <ProductContainer>
        <ImageContainer>
          <Image src={product.imageUrl}
            alt=''
            width={520} height={480} />
        </ImageContainer>
        <ProductsDetailsContainer>
          <h1>{product.name}</h1>
          <span>{product.price}</span>
          <p>
            {product.description}
          </p>

          <button onClick={handleBuyProduct} disabled={isCreatingCheckoutSession}>
            Comprar
          </button>
        </ProductsDetailsContainer>
      </ProductContainer>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: true
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const productId = params?.id

  const product = await stripe.products.retrieve(productId as string, {
    expand: ['default_price']
  })
  const price = product.default_price as Stripe.Price

  return {
    props: {
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.images[0],
        description: product.description,
        price: new Intl.NumberFormat('pt-Br', {
          style: 'currency',
          currency: 'BRL'
        }).format(Number(price.unit_amount) / 100),
        defaultPriceId: price.id
      }
    },
    revalidate: 60 * 60 * 1
  }
}